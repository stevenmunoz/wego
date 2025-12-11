"""Unit tests for User entity."""

from src.domain.entities import User, UserRole, UserStatus


class TestUserEntity:
    """Test cases for User entity."""

    def test_create_user(self) -> None:
        """Test user creation."""
        user = User.create(
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            role=UserRole.USER,
        )

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.role == UserRole.USER
        assert user.status == UserStatus.ACTIVE
        assert user.is_verified is False

    def test_is_active(self) -> None:
        """Test is_active method."""
        user = User.create(
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
        )

        assert user.is_active() is True

        user.suspend()
        assert user.is_active() is False

    def test_is_admin(self) -> None:
        """Test is_admin method."""
        user = User.create(
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            role=UserRole.ADMIN,
        )

        assert user.is_admin() is True

    def test_verify_email(self) -> None:
        """Test verify_email method."""
        user = User.create(
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
        )

        assert user.is_verified is False
        user.verify_email()
        assert user.is_verified is True

    def test_suspend_user(self) -> None:
        """Test suspend method."""
        user = User.create(
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
        )

        user.suspend()
        assert user.status == UserStatus.SUSPENDED

    def test_activate_user(self) -> None:
        """Test activate method."""
        user = User.create(
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
        )

        user.suspend()
        user.activate()
        assert user.status == UserStatus.ACTIVE

    def test_update_profile(self) -> None:
        """Test update_profile method."""
        user = User.create(
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
        )

        user.update_profile(full_name="Updated Name")
        assert user.full_name == "Updated Name"
