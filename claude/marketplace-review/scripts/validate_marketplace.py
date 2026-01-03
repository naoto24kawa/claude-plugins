#!/usr/bin/env python3
"""
Marketplace.json validator script.

Validates the structure and content of .claude-plugin/marketplace.json,
with special focus on verifying that all referenced paths actually exist.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple


class MarketplaceValidator:
    """Validator for marketplace.json files."""

    def __init__(self, marketplace_path: Path):
        """
        Initialize validator.

        Args:
            marketplace_path: Path to the marketplace.json file
        """
        self.marketplace_path = marketplace_path
        self.repo_root = marketplace_path.parent.parent
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate(self) -> Tuple[bool, List[str], List[str]]:
        """
        Run all validations.

        Returns:
            Tuple of (success, errors, warnings)
        """
        # Load and parse JSON
        try:
            with open(self.marketplace_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON syntax: {e}")
            return False, self.errors, self.warnings
        except FileNotFoundError:
            self.errors.append(f"File not found: {self.marketplace_path}")
            return False, self.errors, self.warnings

        # Run validation checks
        self._validate_structure()
        self._validate_plugins()

        return len(self.errors) == 0, self.errors, self.warnings

    def _validate_structure(self) -> None:
        """Validate top-level structure."""
        # Required fields
        if "name" not in self.data:
            self.errors.append("Missing required field: 'name'")
        elif not self._is_kebab_case(self.data["name"]):
            self.errors.append(f"Marketplace name '{self.data['name']}' should be in kebab-case")

        if "owner" not in self.data:
            self.errors.append("Missing required field: 'owner'")
        else:
            owner = self.data["owner"]
            if not isinstance(owner, dict):
                self.errors.append("Field 'owner' should be an object")
            else:
                if "name" not in owner:
                    self.errors.append("Missing required field: 'owner.name'")
                if "email" not in owner:
                    self.warnings.append("Missing recommended field: 'owner.email'")

        if "plugins" not in self.data:
            self.errors.append("Missing required field: 'plugins'")
        elif not isinstance(self.data["plugins"], list):
            self.errors.append("Field 'plugins' should be an array")

    def _validate_plugins(self) -> None:
        """Validate all plugin entries."""
        if "plugins" not in self.data or not isinstance(self.data["plugins"], list):
            return

        for idx, plugin in enumerate(self.data["plugins"]):
            self._validate_plugin(plugin, idx)

    def _validate_plugin(self, plugin: Dict[str, Any], idx: int) -> None:
        """
        Validate a single plugin entry.

        Args:
            plugin: Plugin object
            idx: Index in plugins array
        """
        prefix = f"Plugin [{idx}]"

        # Required fields
        if "name" not in plugin:
            self.errors.append(f"{prefix}: Missing required field 'name'")
            return

        plugin_name = plugin["name"]
        prefix = f"Plugin '{plugin_name}'"

        if not self._is_kebab_case(plugin_name):
            self.errors.append(f"{prefix}: Name should be in kebab-case")

        if "source" not in plugin:
            self.errors.append(f"{prefix}: Missing required field 'source'")

        # Validate version format if present
        if "version" in plugin:
            if not self._is_valid_version(plugin["version"]):
                self.warnings.append(
                    f"{prefix}: Version '{plugin['version']}' should follow semver format (e.g., '0.1.0')"
                )

        # Validate paths
        if "agents" in plugin:
            self._validate_agent_paths(plugin["agents"], plugin_name)

        if "skills" in plugin:
            self._validate_skill_paths(plugin["skills"], plugin_name)

        if "mcpServers" in plugin:
            self._validate_mcp_server_path(plugin["mcpServers"], plugin_name)

    def _validate_agent_paths(self, agents: Any, plugin_name: str) -> None:
        """
        Validate agent paths.

        Args:
            agents: Agent paths (should be array)
            plugin_name: Name of the plugin
        """
        prefix = f"Plugin '{plugin_name}'"

        if not isinstance(agents, list):
            self.errors.append(f"{prefix}: 'agents' should be an array")
            return

        for agent_path in agents:
            if not isinstance(agent_path, str):
                self.errors.append(f"{prefix}: Agent path should be a string")
                continue

            full_path = self.repo_root / agent_path.lstrip('./')
            if not full_path.exists():
                self.errors.append(
                    f"{prefix}: Agent file not found: {agent_path}\n"
                    f"  Expected at: {full_path}"
                )
            elif not full_path.is_file():
                self.errors.append(f"{prefix}: Agent path is not a file: {agent_path}")
            elif not agent_path.endswith('.md'):
                self.warnings.append(
                    f"{prefix}: Agent file '{agent_path}' should have .md extension"
                )

    def _validate_skill_paths(self, skills: Any, plugin_name: str) -> None:
        """
        Validate skill paths.

        Args:
            skills: Skill paths (should be array)
            plugin_name: Name of the plugin
        """
        prefix = f"Plugin '{plugin_name}'"

        if not isinstance(skills, list):
            self.errors.append(f"{prefix}: 'skills' should be an array")
            return

        for skill_path in skills:
            if not isinstance(skill_path, str):
                self.errors.append(f"{prefix}: Skill path should be a string")
                continue

            full_path = self.repo_root / skill_path.lstrip('./')
            if not full_path.exists():
                self.errors.append(
                    f"{prefix}: Skill directory not found: {skill_path}\n"
                    f"  Expected at: {full_path}"
                )
            elif not full_path.is_dir():
                self.errors.append(f"{prefix}: Skill path is not a directory: {skill_path}")
            else:
                # Check for SKILL.md
                skill_md = full_path / "SKILL.md"
                if not skill_md.exists():
                    self.errors.append(
                        f"{prefix}: Missing SKILL.md in skill directory: {skill_path}"
                    )

    def _validate_mcp_server_path(self, mcp_path: Any, plugin_name: str) -> None:
        """
        Validate MCP server path.

        Args:
            mcp_path: MCP server path
            plugin_name: Name of the plugin
        """
        prefix = f"Plugin '{plugin_name}'"

        if not isinstance(mcp_path, str):
            self.errors.append(f"{prefix}: 'mcpServers' should be a string")
            return

        full_path = self.repo_root / mcp_path.lstrip('./')
        if not full_path.exists():
            self.errors.append(
                f"{prefix}: MCP server file not found: {mcp_path}\n"
                f"  Expected at: {full_path}"
            )
        elif not full_path.is_file():
            self.errors.append(f"{prefix}: MCP server path is not a file: {mcp_path}")
        elif not mcp_path.endswith('.json'):
            self.warnings.append(
                f"{prefix}: MCP server file '{mcp_path}' should have .json extension"
            )

    @staticmethod
    def _is_kebab_case(s: str) -> bool:
        """Check if string is in kebab-case."""
        if not s:
            return False
        return all(c.islower() or c.isdigit() or c == '-' for c in s) and not s.startswith('-') and not s.endswith('-')

    @staticmethod
    def _is_valid_version(version: str) -> bool:
        """Check if version follows semver format (loosely)."""
        parts = version.split('.')
        if len(parts) != 3:
            return False
        return all(part.isdigit() for part in parts)


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python validate_marketplace.py <path-to-marketplace.json>")
        sys.exit(1)

    marketplace_path = Path(sys.argv[1])
    validator = MarketplaceValidator(marketplace_path)
    success, errors, warnings = validator.validate()

    # Print results
    print("=" * 70)
    print("Marketplace Validation Report")
    print("=" * 70)
    print(f"File: {marketplace_path}")
    print()

    if warnings:
        print(f"⚠️  Warnings ({len(warnings)}):")
        for warning in warnings:
            print(f"  - {warning}")
        print()

    if errors:
        print(f"❌ Errors ({len(errors)}):")
        for error in errors:
            print(f"  - {error}")
        print()
        print("Validation FAILED")
        sys.exit(1)
    else:
        print("✅ Validation PASSED")
        if warnings:
            print(f"   ({len(warnings)} warning(s) found)")
        sys.exit(0)


if __name__ == "__main__":
    main()
