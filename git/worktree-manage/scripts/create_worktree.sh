#!/usr/bin/env bash
#
# create_worktree.sh - Interactive git worktree creation with best practices
#
# Usage:
#   ./create_worktree.sh [worktree-name] [branch-name] [base-branch]
#
# Examples:
#   ./create_worktree.sh feature-auth feature/user-auth main
#   ./create_worktree.sh hotfix-bug hotfix/critical-bug origin/production
#   ./create_worktree.sh  # Interactive mode
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
    fi
}

# Get the repository root directory
get_repo_root() {
    git rev-parse --show-toplevel
}

# Get the parent directory of the repository (where worktrees will be created)
get_worktree_parent() {
    local repo_root
    repo_root=$(get_repo_root)
    dirname "$repo_root"
}

# Validate worktree name
validate_worktree_name() {
    local name=$1

    if [[ -z "$name" ]]; then
        error "Worktree name cannot be empty"
    fi

    if [[ "$name" =~ [[:space:]] ]]; then
        error "Worktree name cannot contain spaces"
    fi

    if [[ "$name" =~ ^[/-] ]]; then
        error "Worktree name cannot start with / or -"
    fi
}

# Check if worktree already exists
check_worktree_exists() {
    local worktree_path=$1

    if [[ -d "$worktree_path" ]]; then
        error "Worktree directory already exists: $worktree_path"
    fi

    if git worktree list | grep -q "$worktree_path"; then
        error "Worktree is already registered: $worktree_path"
    fi
}

# Check if branch exists
branch_exists() {
    local branch=$1
    git show-ref --verify --quiet "refs/heads/$branch"
}

# Check if remote branch exists
remote_branch_exists() {
    local branch=$1
    git show-ref --verify --quiet "refs/remotes/$branch"
}

# Get list of existing worktrees
list_worktrees() {
    info "Existing worktrees:"
    git worktree list
    echo
}

# Suggest worktree name based on branch name
suggest_worktree_name() {
    local branch=$1
    # Convert branch name to directory-safe format
    # e.g., "feature/user-auth" -> "feature-user-auth"
    echo "$branch" | sed 's/\//-/g' | sed 's/^origin-//'
}

# Interactive mode
interactive_mode() {
    echo -e "${BLUE}=== Git Worktree Creator ===${NC}\n"

    list_worktrees

    # Get worktree name
    read -p "Enter worktree directory name: " worktree_name
    validate_worktree_name "$worktree_name"

    # Get branch name
    read -p "Enter branch name (or leave empty to use worktree name): " branch_name
    if [[ -z "$branch_name" ]]; then
        branch_name="$worktree_name"
    fi

    # Check if branch exists
    local create_new=true
    if branch_exists "$branch_name"; then
        warning "Branch '$branch_name' already exists"
        read -p "Check out existing branch? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_new=false
        else
            error "Aborted"
        fi
    fi

    # Get base branch if creating new
    local base_branch=""
    if $create_new; then
        read -p "Enter base branch (default: current branch): " base_branch
    fi

    create_worktree "$worktree_name" "$branch_name" "$base_branch" "$create_new"
}

# Create worktree
create_worktree() {
    local worktree_name=$1
    local branch_name=$2
    local base_branch=${3:-}
    local create_new=${4:-true}

    local worktree_parent
    worktree_parent=$(get_worktree_parent)
    local worktree_path="$worktree_parent/$worktree_name"

    info "Creating worktree at: $worktree_path"
    info "Branch: $branch_name"

    # Validate
    validate_worktree_name "$worktree_name"
    check_worktree_exists "$worktree_path"

    # Build git command
    local git_cmd="git worktree add"

    if $create_new; then
        git_cmd="$git_cmd -b $branch_name"
    fi

    git_cmd="$git_cmd $worktree_path"

    if [[ -n "$base_branch" ]]; then
        git_cmd="$git_cmd $base_branch"
    elif ! $create_new; then
        git_cmd="$git_cmd $branch_name"
    fi

    info "Executing: $git_cmd"

    # Execute
    if eval "$git_cmd"; then
        success "Worktree created successfully!"
        echo
        info "Worktree location: $worktree_path"
        info "Branch: $branch_name"
        echo
        info "Next steps:"
        echo "  cd $worktree_path"
        echo "  # Start working on your changes"
        echo
        info "When finished:"
        echo "  git worktree remove $worktree_path"

        # Show git status in new worktree
        echo
        info "Current status:"
        (cd "$worktree_path" && git status -s)
    else
        error "Failed to create worktree"
    fi
}

# Main script
main() {
    check_git_repo

    if [[ $# -eq 0 ]]; then
        # Interactive mode
        interactive_mode
    elif [[ $# -eq 1 && "$1" == "-h" || "$1" == "--help" ]]; then
        # Help
        cat << EOF
Usage: $0 [worktree-name] [branch-name] [base-branch]

Create a new git worktree with best practices.

Arguments:
  worktree-name   Name of the worktree directory (required in non-interactive mode)
  branch-name     Name of the branch (defaults to worktree-name)
  base-branch     Base branch for new branch (defaults to current branch)

Examples:
  $0                                    # Interactive mode
  $0 feature-auth                       # Create worktree and new branch with same name
  $0 feature-auth feature/user-auth     # Custom branch name
  $0 hotfix-bug hotfix/bug origin/main  # Create from origin/main

Options:
  -h, --help      Show this help message

The worktree will be created as a sibling to the current repository directory.
EOF
        exit 0
    else
        # Command-line mode
        local worktree_name=$1
        local branch_name=${2:-$worktree_name}
        local base_branch=${3:-}

        local create_new=true
        if branch_exists "$branch_name"; then
            warning "Branch '$branch_name' already exists, checking it out"
            create_new=false
        fi

        create_worktree "$worktree_name" "$branch_name" "$base_branch" "$create_new"
    fi
}

main "$@"
