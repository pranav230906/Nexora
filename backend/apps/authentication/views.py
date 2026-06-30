from django.contrib.auth import get_user_model, authenticate
from django.core.signing import Signer, BadSignature
from django.shortcuts import redirect
import requests
import os
from rest_framework import status, views, permissions, generics
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.mail import send_mail
from django.conf import settings
from drf_spectacular.utils import extend_schema

from .serializers import (
    UserRegisterSerializer,
    UserProfileSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    GoogleAuthSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer
)
from .models import OTPVerification
import random

User = get_user_model()
signer = Signer()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegisterSerializer

    @extend_schema(responses={201: UserProfileSerializer})
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate 6-digit verification code
        code = f"{random.randint(100000, 999999)}"
        OTPVerification.objects.create(user=user, code=code, purpose='signup')
        
        # Send actual email OTP
        try:
            send_mail(
                subject="Your Nexora Verification Code",
                message=f"Hello,\n\nYour 6-digit verification code is: {code}\n\nThis code will expire shortly.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending email: {e}")

        return Response({
            'user': UserProfileSerializer(user).data,
            'message': 'Account created. Please verify your email using the OTP sent to your mailbox.',
            'otp_code_stub': code
        }, status=status.HTTP_201_CREATED)


class VerifyEmailView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({"error": "Missing token parameter"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            email = signer.unsign(token)
            user = User.objects.get(email=email)
            if not user.is_email_verified:
                user.is_email_verified = True
                user.save()
            return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)
        except (BadSignature, User.DoesNotExist):
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class ForgotPasswordView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(request=ForgotPasswordSerializer)
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate mock password reset token
        reset_token = signer.sign(user.email)
        reset_url = f"http://localhost:3000/reset-password/?token={reset_token}"
        
        print(f"--- MOCK PASSWORD RESET EMAIL SENT ---")
        print(f"To: {email}")
        print(f"Link: {reset_url}")
        print(f"--------------------------------------")

        return Response({
            "message": "Password reset email sent (Stub).",
            "reset_link_stub": reset_url
        }, status=status.HTTP_200_OK)


class ResetPasswordView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(request=ResetPasswordSerializer)
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']

        try:
            email = signer.unsign(token)
            user = User.objects.get(email=email)
            user.set_password(password)
            user.save()
            return Response({"message": "Password reset successfully!"}, status=status.HTTP_200_OK)
        except (BadSignature, User.DoesNotExist):
            return Response({"error": "Invalid or expired reset token"}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(request=GoogleAuthSerializer)
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']

        # Google Token Validation Mock/Stub
        # In production:
        # from google.oauth2 import id_token
        # from google.auth.transport import requests
        # idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
        # email = idinfo['email']
        
        # Stub logic:
        email = f"google_{token[:5]}@gmail.com"
        username = f"google_{token[:5]}"
        google_id = f"g_{token[:10]}"

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'google_id': google_id,
                'is_email_verified': True
            }
        )

        tokens = get_tokens_for_user(user)

        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': tokens,
            'created': created
        }, status=status.HTTP_200_OK)


class GoogleCallbackView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
        code = request.GET.get('code')
        if not code:
            return redirect(f"{frontend_url}/login?error=no_code")

        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback"),
            "grant_type": "authorization_code"
        }
        
        try:
            response = requests.post(token_url, data=payload)
            token_data = response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                access_token = f"mock_google_{code[:10]}"
                email = f"google_{access_token[:5]}@gmail.com"
                username = f"google_{access_token[:5]}"
                avatar = ""
                first_name = "Google"
                last_name = "User"
            else:
                # Fetch real UserInfo from Google
                userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
                userinfo_response = requests.get(userinfo_url, headers={"Authorization": f"Bearer {access_token}"})
                if userinfo_response.status_code == 200:
                    userinfo = userinfo_response.json()
                    email = userinfo.get("email")
                    username = userinfo.get("name", email.split('@')[0])
                    avatar = userinfo.get("picture", "")
                    
                    full_name = userinfo.get("name", "")
                    parts = full_name.split(' ', 1)
                    first_name = parts[0]
                    last_name = parts[1] if len(parts) > 1 else ""
                else:
                    email = f"google_{access_token[:5]}@gmail.com"
                    username = f"google_{access_token[:5]}"
                    avatar = ""
                    first_name = "Google"
                    last_name = "User"

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name,
                    'google_id': f"g_{access_token[:10]}",
                    'is_email_verified': True,
                    'avatar': avatar
                }
            )
            
            # If user already exists, update their profile picture and name details
            if not created:
                if avatar:
                    user.avatar = avatar
                if first_name:
                    user.first_name = first_name
                    user.last_name = last_name
                user.save()

            tokens = get_tokens_for_user(user)
            access = tokens['access']
            refresh = tokens['refresh']

            return redirect(f"{frontend_url}/login#access_token={access}&refresh_token={refresh}")
        except Exception as e:
            return redirect(f"{frontend_url}/login?error={str(e)}")


class SendOTPView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(request=SendOTPSerializer)
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        purpose = serializer.validated_data['purpose']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # Generate random 6 digit code
        code = f"{random.randint(100000, 999999)}"
        OTPVerification.objects.filter(user=user, purpose=purpose).delete() # Clean old OTPs
        OTPVerification.objects.create(user=user, code=code, purpose=purpose)

        # Send actual email OTP
        try:
            send_mail(
                subject="Your Nexora Verification Code",
                message=f"Hello,\n\nYour 6-digit verification code is: {code}\n\nThis code will expire shortly.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending email: {e}")

        return Response({
            "message": "OTP verification code sent (Stub).",
            "otp_code_stub": code
        }, status=status.HTTP_200_OK)


class VerifyOTPView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(request=VerifyOTPSerializer)
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        purpose = serializer.validated_data['purpose']

        try:
            user = User.objects.get(email=email)
            otp_record = OTPVerification.objects.filter(user=user, code=code, purpose=purpose).first()
            
            if not otp_record:
                return Response({"error": "Invalid or expired OTP code."}, status=status.HTTP_400_BAD_REQUEST)

            # Successfully verified!
            otp_record.delete() # Consume the OTP
            
            token = None
            if purpose == 'signup':
                user.is_email_verified = True
                user.save()
            elif purpose == 'reset':
                token = signer.sign(user.email)

            return Response({
                "message": "OTP code verified successfully.",
                "verified": True,
                "token": token
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
