#!/usr/bin/env python3
"""Validation script to ensure template has no inconsistencies."""

import os
import sys
from pathlib import Path


def check_no_sqlalchemy() -> bool:
    """Ensure no SQLAlchemy imports in Firestore project."""
    print("Checking for SQLAlchemy references...")
    bad_imports = []
    backend_src = Path("backend/src")

    if not backend_src.exists():
        print("  ⚠️  backend/src directory not found")
        return True

    for py_file in backend_src.rglob("*.py"):
        content = py_file.read_text()
        if "sqlalchemy" in content.lower():
            bad_imports.append(str(py_file))

    if bad_imports:
        print("  ❌ Found SQLAlchemy imports in Firestore project:")
        for path in bad_imports:
            print(f"     - {path}")
        return False

    print("  ✅ No SQLAlchemy references found")
    return True


def check_container_complete() -> bool:
    """Ensure all use cases are registered in Container."""
    print("Checking Container completeness...")
    container_file = Path("backend/src/infrastructure/container.py")

    if not container_file.exists():
        print("  ❌ Container file not found")
        return False

    content = container_file.read_text()

    required = [
        "create_conversation_use_case",
        "get_conversation_use_case",
        "list_conversations_use_case",
        "chat_use_case",
        "conversation_repository",
        "message_repository",
        "execution_repository",
    ]

    missing = [r for r in required if r not in content]

    if missing:
        print(f"  ❌ Container missing providers: {', '.join(missing)}")
        return False

    print("  ✅ Container has all required providers")
    return True


def check_no_docker_files() -> bool:
    """Ensure Docker files have been removed."""
    print("Checking for Docker files...")
    docker_files = [
        "docker-compose.yml",
        "docker-compose.dev.yml",
        "docker-compose.prod.yml",
        "docker/",
    ]

    found = []
    for df in docker_files:
        if Path(df).exists():
            found.append(df)

    if found:
        print(f"  ⚠️  Found Docker files (should be removed): {', '.join(found)}")
        return False

    print("  ✅ No Docker files found")
    return True


def check_required_scripts() -> bool:
    """Ensure required scripts exist."""
    print("Checking for required scripts...")
    required_scripts = [
        "dev.sh",
        "stop.sh",
        "setup.sh",
    ]

    missing = []
    for script in required_scripts:
        if not Path(script).exists():
            missing.append(script)

    if missing:
        print(f"  ❌ Missing scripts: {', '.join(missing)}")
        return False

    print("  ✅ All required scripts exist")
    return True


def check_python_version_file() -> bool:
    """Check if .python-version file exists."""
    print("Checking for .python-version file...")

    if not Path(".python-version").exists():
        print("  ⚠️  .python-version file not found (recommended)")
        return True  # Warning only, not a failure

    content = Path(".python-version").read_text().strip()
    if content != "3.11":
        print(f"  ⚠️  .python-version should be 3.11 (found: {content})")
        return True  # Warning only

    print("  ✅ .python-version file exists and is correct")
    return True


def check_env_template() -> bool:
    """Check if simplified .env template exists."""
    print("Checking for .env.example in backend...")

    env_file = Path("backend/.env.example")
    if not env_file.exists():
        print("  ⚠️  backend/.env.example not found")
        return True  # Warning only

    content = env_file.read_text()

    # Check for required sections
    required_keys = [
        "LLM_PROVIDER",
        "OPENAI_API_KEY",
        "FIREBASE_PROJECT_ID",
    ]

    missing = [key for key in required_keys if key not in content]

    if missing:
        print(f"  ⚠️  Missing keys in .env.example: {', '.join(missing)}")
        return True  # Warning only

    print("  ✅ .env.example looks good")
    return True


def main():
    """Run all validation checks."""
    print("=" * 60)
    print("Template Validation")
    print("=" * 60)
    print()

    checks = [
        ("No SQLAlchemy in Firestore project", check_no_sqlalchemy),
        ("Container has all providers", check_container_complete),
        ("No Docker files remain", check_no_docker_files),
        ("Required scripts exist", check_required_scripts),
        ("Python version file exists", check_python_version_file),
        (".env template is complete", check_env_template),
    ]

    all_passed = True
    for name, check_func in checks:
        try:
            if not check_func():
                all_passed = False
        except Exception as e:
            print(f"  ❌ {name}: Error - {str(e)}")
            all_passed = False
        print()

    print("=" * 60)
    if all_passed:
        print("✅ All validation checks passed!")
        print("=" * 60)
        return 0
    else:
        print("❌ Some validation checks failed")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
