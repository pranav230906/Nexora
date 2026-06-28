from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    """
    Extends standard Django user model to include avatar uploads,
    timezone configurations, and Google integration tokens.
    """
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)
    avatar = models.FileField(upload_to='avatars/', blank=True, null=True)
    timezone = models.CharField(max_length=64, default='UTC')
    google_id = models.CharField(max_length=128, unique=True, blank=True, null=True)

    # Make email unique for auth login routines
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class OTPVerification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=16, default='signup') # 'signup' or 'reset'
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.code} ({self.purpose})"
