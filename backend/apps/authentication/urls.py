from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView,
    UserProfileView,
    ForgotPasswordView,
    ResetPasswordView,
    VerifyEmailView,
    LogoutView,
    GoogleLoginView,
    SendOTPView,
    VerifyOTPView
)

app_name = 'authentication'

urlpatterns = [
    # Core Auth JWT
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # OTP verification
    path('send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    
    # User Profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Password Resets & Email Verification
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    
    # Google OAuth
    path('google/', GoogleLoginView.as_view(), name='google_login'),
]
