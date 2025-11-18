#!/usr/bin/env bash
#
# cleanup_worktrees.sh - Clean up git worktrees and associated branches
#
# Usage:
#   ./cleanup_worktrees.sh [options]
#
# Options:
#   -a, --all           Remove all worktrees except main/master
#   -p, --prune         Prune worktree metadata only
#   -i, --interactive   Interactive selection mode
#   -l, --list          List all worktrees and exit
#   -d, --dry-run       Show what would be done without doing it
#   -h, --help          Show help message
#
# Examples:
#   ./cleanup_worktrees.sh -i               # Interactive mode
#   ./cleanup_worktrees.sh -p               # Prune metadata
#   ./cleanup_worktrees.sh -d -a            # Dry-run all cleanup
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
INTERACTIVE=false
LIST_ONLY=false
PRUNE_ONLY=false
REMOVE_ALL=false

# Helper functions
error() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

info() {
    echo -e "${BLUE}Info: $1${NC}"
}

success() {
    echo -e "${GREEN}Success: $1${NC}"
}

warning() {
    echo -e "${YELLOW}Warning: $1${NC}"
}

highlight() {
    echo -e "${CYAN}$1${NC}"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
    fi
}

# Get current worktree path
get_current_worktree() {
    git rev-parse --show-toplevel
}

# Parse worktree list output
parse_worktree_list() {
    git worktree list --porcelain | awk '
        /^worktree / { path = substr($0, 10); }
        /^HEAD / { head = substr($0, 6); }
        /^branch / { branch = substr($0, 8); }
        /^$/ {
            if (path) {
                print path "|" head "|" (branch ? branch : "(detached)");
                path = ""; head = ""; branch = "";
            }
        }
        END {
            if (path) {
                print path "|" head "|" (branch ? branch : "(detached)");
            }
        }
    '
}

# List all worktrees with details
list_worktrees() {
    local current_worktree
    current_worktree=$(get_current_worktree)

    echo -e "${BLUE}=== Git Worktrees ===${NC}\n"

    local count=0
    while IFS='|' read -r path head branch; do
        count=$((count + 1))

        echo -e "${CYAN}[$count]${NC} $path"
        echo "    Branch: $branch"
        echo "    HEAD: ${head:0:8}"

        if [[ "$path" == "$current_worktree" ]]; then
            echo -e "    ${GREEN}(current)${NC}"
        fi

        # Check if directory exists
        if [[ ! -d "$path" ]]; then
            echo -e "    ${RED}(missing directory)${NC}"
        fi

        # Check if worktree is locked
        if git worktree list --porcelain | grep -A3 "^worktree $path$" | grep -q "^locked"; then
            echo -e "    ${YELLOW}(locked)${NC}"
        fi

        echo
    done < <(parse_worktree_list)

    if [[ $count -eq 0 ]]; then
        info "No worktrees found"
    fi

    return $count
}

# Prune worktree metadata
prune_worktrees() {
    info "Pruning worktree metadata..."

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would execute: git worktree prune --verbose"
    else
        if git worktree prune --verbose; then
            success "Worktree metadata pruned"
        else
            warning "Prune completed with warnings"
        fi
    fi
}

# Check if branch is protected (main, master, develop, etc.)
is_protected_branch() {
    local branch=$1
    case "$branch" in
        refs/heads/main|refs/heads/master|refs/heads/develop|refs/heads/production|"(detached)")
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Remove a single worktree
remove_worktree() {
    local path=$1
    local branch=$2
    local force=${3:-false}

    local current_worktree
    current_worktree=$(get_current_worktree)

    # Check if it's the current worktree
    if [[ "$path" == "$current_worktree" ]]; then
        warning "Cannot remove current worktree: $path"
        return 1
    fi

    # Check if it's a protected branch
    if is_protected_branch "$branch" && [[ "$force" != true ]]; then
        warning "Skipping protected branch: $branch at $path"
        return 1
    fi

    info "Removing worktree: $path"

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would execute: git worktree remove $path"

        # Check if we should also remove the branch
        local branch_name
        branch_name=${branch#refs/heads/}
        if [[ "$branch_name" != "(detached)" ]] && git show-ref --verify --quiet "refs/heads/$branch_name"; then
            info "[DRY RUN] Would also delete branch: $branch_name"
        fi
    else
        if git worktree remove "$path" 2>/dev/null; then
            success "Removed worktree: $path"

            # Ask to remove branch if it still exists
            local branch_name
            branch_name=${branch#refs/heads/}
            if [[ "$branch_name" != "(detached)" ]] && git show-ref --verify --quiet "refs/heads/$branch_name"; then
                if [[ "$INTERACTIVE" == true ]]; then
                    read -p "Delete branch '$branch_name'? (y/n): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        git branch -D "$branch_name" && success "Deleted branch: $branch_name"
                    fi
                else
                    info "Branch still exists: $branch_name (use -i for interactive deletion)"
                fi
            fi
        else
            # Try force removal if directory is missing or locked
            warning "Normal removal failed, trying force removal..."
            if git worktree remove --force "$path" 2>/dev/null; then
                success "Force removed worktree: $path"
            else
                error "Failed to remove worktree: $path"
                return 1
            fi
        fi
    fi

    return 0
}

# Interactive mode
interactive_mode() {
    echo -e "${BLUE}=== Interactive Worktree Cleanup ===${NC}\n"

    local -a paths branches heads
    local count=0

    # Read all worktrees into arrays
    while IFS='|' read -r path head branch; do
        paths[$count]=$path
        heads[$count]=$head
        branches[$count]=$branch
        count=$((count + 1))
    done < <(parse_worktree_list)

    if [[ $count -eq 0 ]]; then
        info "No worktrees to clean up"
        return
    fi

    local current_worktree
    current_worktree=$(get_current_worktree)

    # Display worktrees
    for ((i=0; i<count; i++)); do
        local path=${paths[$i]}
        local branch=${branches[$i]}
        local head=${heads[$i]}

        echo -e "${CYAN}[$((i+1))]${NC} $path"
        echo "    Branch: $branch"
        echo "    HEAD: ${head:0:8}"

        if [[ "$path" == "$current_worktree" ]]; then
            echo -e "    ${GREEN}(current - cannot remove)${NC}"
        elif is_protected_branch "$branch"; then
            echo -e "    ${YELLOW}(protected branch)${NC}"
        fi

        echo
    done

    echo -e "${YELLOW}Options:${NC}"
    echo "  Enter numbers to remove (e.g., 1 3 5)"
    echo "  Enter 'all' to remove all non-protected worktrees"
    echo "  Enter 'prune' to only prune metadata"
    echo "  Press Enter to cancel"
    echo

    read -p "Your choice: " choice

    if [[ -z "$choice" ]]; then
        info "Cancelled"
        return
    fi

    if [[ "$choice" == "prune" ]]; then
        prune_worktrees
        return
    fi

    if [[ "$choice" == "all" ]]; then
        info "Removing all non-protected worktrees..."
        for ((i=0; i<count; i++)); do
            remove_worktree "${paths[$i]}" "${branches[$i]}" false || true
        done
        prune_worktrees
        return
    fi

    # Parse number selections
    local removed=0
    for num in $choice; do
        if [[ "$num" =~ ^[0-9]+$ ]] && [[ $num -ge 1 ]] && [[ $num -le $count ]]; then
            local idx=$((num - 1))
            if remove_worktree "${paths[$idx]}" "${branches[$idx]}" false; then
                removed=$((removed + 1))
            fi
        else
            warning "Invalid selection: $num"
        fi
    done

    if [[ $removed -gt 0 ]]; then
        success "Removed $removed worktree(s)"
        prune_worktrees
    else
        info "No worktrees removed"
    fi
}

# Remove all non-protected worktrees
remove_all_worktrees() {
    info "Removing all non-protected worktrees..."

    local removed=0
    local skipped=0

    while IFS='|' read -r path head branch; do
        if remove_worktree "$path" "$branch" false; then
            removed=$((removed + 1))
        else
            skipped=$((skipped + 1))
        fi
    done < <(parse_worktree_list)

    if [[ $removed -gt 0 ]]; then
        success "Removed $removed worktree(s)"
        if [[ $skipped -gt 0 ]]; then
            info "Skipped $skipped worktree(s)"
        fi
        prune_worktrees
    else
        info "No worktrees removed"
    fi
}

# Show help
show_help() {
    cat << EOF
Git Worktree Cleanup Tool

Usage: $0 [options]

Options:
  -a, --all           Remove all worktrees except main/master/develop
  -p, --prune         Prune worktree metadata only (clean up orphaned entries)
  -i, --interactive   Interactive selection mode (recommended)
  -l, --list          List all worktrees and exit
  -d, --dry-run       Show what would be done without doing it
  -h, --help          Show this help message

Examples:
  $0 -i               Interactive mode (recommended for safety)
  $0 -l               List all worktrees
  $0 -p               Prune orphaned worktree metadata
  $0 -d -a            Dry-run: show what would be removed
  $0 -a               Remove all non-protected worktrees

Notes:
  - Protected branches (main, master, develop, production) are never removed
  - Current worktree cannot be removed
  - Use --dry-run first to see what would be removed
  - Interactive mode allows selective removal and is the safest option

EOF
}

# Parse command-line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--all)
                REMOVE_ALL=true
                shift
                ;;
            -p|--prune)
                PRUNE_ONLY=true
                shift
                ;;
            -i|--interactive)
                INTERACTIVE=true
                shift
                ;;
            -l|--list)
                LIST_ONLY=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1 (use -h for help)"
                ;;
        esac
    done
}

# Main script
main() {
    check_git_repo

    parse_args "$@"

    if [[ "$LIST_ONLY" == true ]]; then
        list_worktrees
        exit 0
    fi

    if [[ "$PRUNE_ONLY" == true ]]; then
        prune_worktrees
        exit 0
    fi

    if [[ "$INTERACTIVE" == true ]]; then
        interactive_mode
        exit 0
    fi

    if [[ "$REMOVE_ALL" == true ]]; then
        remove_all_worktrees
        exit 0
    fi

    # Default: show help
    show_help
    echo
    list_worktrees
}

main "$@"
