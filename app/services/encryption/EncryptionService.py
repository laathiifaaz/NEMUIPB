import os

from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv


load_dotenv()


class EncryptionService:
    def __init__(self):
        fernet_key = os.getenv("FERNET_KEY")

        if not fernet_key:
            raise RuntimeError("FERNET_KEY environment variable is not configured")

        try:
            self.fernet = Fernet(fernet_key.encode())
        except ValueError as exc:
            raise RuntimeError("FERNET_KEY environment variable is invalid") from exc

    def encrypt(self, value: str) -> str:
        if not isinstance(value, str):
            raise TypeError("Sensitive value must be a string before encryption")

        if self._looks_encrypted(value):
            return value

        return self.fernet.encrypt(value.encode("utf-8")).decode("utf-8")

    def decrypt(self, value: str) -> str | None:
        if value is None:
            return None

        if not isinstance(value, str):
            return value

        try:
            return self.fernet.decrypt(value.encode("utf-8")).decode("utf-8")
        except InvalidToken:
            # Existing deployments may already contain plaintext legacy rows.
            # Return legacy plaintext as-is, but avoid exposing malformed Fernet tokens.
            if self._looks_encrypted(value):
                return None
            return value

    def encrypt_if_exists(self, value: str | None) -> str | None:
        if value is None or value == "":
            return value

        return self.encrypt(value)

    def decrypt_if_exists(self, value: str | None) -> str | None:
        if value is None or value == "":
            return value

        return self.decrypt(value)

    @staticmethod
    def _looks_encrypted(value: str) -> bool:
        return isinstance(value, str) and value.startswith("gAAAA")


encryption_service = EncryptionService()
