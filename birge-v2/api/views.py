from django.utils import timezone
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, ProfileSerializer,
    EventSerializer, ParticipationSerializer, SkillSerializer,
    PublicVolunteerProfileSerializer, StudentInvitationSerializer
)
from .models import User, VerificationCode, Event, Participation, Skill, VolunteerProfile, EducationalInstitution, StudentInvitation
from django.core.mail import send_mail
from django.conf import settings
import random
import string

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        code = ''.join(random.choices(string.digits, k=6))
        VerificationCode.objects.create(email=user.email, code=code)

        subject = 'Подтверждение email для Birge'
        message = f'Ваш код подтверждения: {code}'
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

        return Response({
            'message': 'Пользователь создан. Код подтверждения отправлен на email.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        if not email or not code:
            return Response({'error': 'Email и код обязательны'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            verification = VerificationCode.objects.get(email=email, code=code, is_used=False)
        except VerificationCode.DoesNotExist:
            return Response({'error': 'Неверный код или email'}, status=status.HTTP_400_BAD_REQUEST)

        verification.is_used = True
        verification.save()

        try:
            user = User.objects.get(email=email)
            user.is_verified = True
            user.save()
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'message': 'Email подтверждён'}, status=status.HTTP_200_OK)

# ---------- МЕРОПРИЯТИЯ ----------
class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['organization', 'educational_institution']:
            if user.role == 'organization':
                try:
                    org = user.organization_profile
                    return Event.objects.filter(organizer_organization=org)
                except:
                    return Event.objects.none()
            elif user.role == 'educational_institution':
                try:
                    inst = user.institution_profile
                    return Event.objects.filter(organizer_institution=inst)
                except:
                    return Event.objects.none()
        else:
            now = timezone.now()
            return Event.objects.filter(date_start__gte=now).order_by('date_start')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'organization':
            try:
                org = user.organization_profile
                serializer.save(organizer_organization=org)
            except:
                raise serializers.ValidationError('У вас нет профиля организации')
        elif user.role == 'educational_institution':
            try:
                inst = user.institution_profile
                serializer.save(organizer_institution=inst)
            except:
                raise serializers.ValidationError('У вас нет профиля учебного заведения')
        else:
            raise serializers.ValidationError('Вы не можете создавать мероприятия')

class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'organization':
            try:
                org = user.organization_profile
                return Event.objects.filter(organizer_organization=org)
            except:
                return Event.objects.none()
        elif user.role == 'educational_institution':
            try:
                inst = user.institution_profile
                return Event.objects.filter(organizer_institution=inst)
            except:
                return Event.objects.none()
        return Event.objects.none()

# ---------- УЧАСТНИКИ ----------
class EventParticipantsView(generics.ListAPIView):
    serializer_class = ParticipationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        user = self.request.user
        try:
            event = Event.objects.get(id=event_id)
            if (event.organizer_organization and event.organizer_organization.user == user) or \
               (event.organizer_institution and event.organizer_institution.user == user):
                return Participation.objects.filter(event=event)
        except Event.DoesNotExist:
            pass
        return Participation.objects.none()

class VerifyParticipationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, participation_id):
        try:
            participation = Participation.objects.get(id=participation_id)
            event = participation.event
            user = request.user
            if (event.organizer_organization and event.organizer_organization.user == user) or \
               (event.organizer_institution and event.organizer_institution.user == user):
                participation.verified = True
                participation.save()
                return Response({'message': 'Часы подтверждены'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'У вас нет прав'}, status=status.HTTP_403_FORBIDDEN)
        except Participation.DoesNotExist:
            return Response({'error': 'Участие не найдено'}, status=status.HTTP_404_NOT_FOUND)

# ---------- НАВЫКИ ----------
class SkillListView(generics.ListAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

# ---------- РЕГИСТРАЦИЯ НА МЕРОПРИЯТИЕ (ВОЛОНТЁР) ----------
class ParticipateEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Код мероприятия обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            event = Event.objects.get(code=code)
        except Event.DoesNotExist:
            return Response({'error': 'Мероприятие не найдено'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.user.role != 'volunteer':
            return Response({'error': 'Только волонтёры могут регистрироваться'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            profile = request.user.volunteer_profile
        except VolunteerProfile.DoesNotExist:
            return Response({'error': 'У вас нет профиля волонтёра'}, status=status.HTTP_400_BAD_REQUEST)
        
        if Participation.objects.filter(volunteer=profile, event=event).exists():
            return Response({'error': 'Вы уже зарегистрированы на это мероприятие'}, status=status.HTTP_400_BAD_REQUEST)
        
        participation = Participation.objects.create(volunteer=profile, event=event)
        return Response({'message': 'Регистрация успешна', 'participation_id': participation.id}, status=status.HTTP_201_CREATED)

# ---------- ИМПОРТ СТУДЕНТОВ ----------
class ImportStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'educational_institution':
            return Response({'error': 'Доступ только для учебных заведений'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            institution = request.user.institution_profile
        except EducationalInstitution.DoesNotExist:
            return Response({'error': 'Профиль учебного заведения не найден'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Файл не загружен'}, status=status.HTTP_400_BAD_REQUEST)
        
        import csv, io
        decoded_file = file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        created_count = 0
        invited_count = 0
        errors = []
        
        for row in reader:
            email = row.get('email', '').strip()
            if not email:
                errors.append(f"Пропущена строка: отсутствует email в {row}")
                continue
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'role': 'volunteer',
                    'first_name': row.get('first_name', ''),
                    'last_name': row.get('last_name', ''),
                    'is_verified': False,
                }
            )
            if created:
                created_count += 1
            else:
                invited_count += 1
            
            StudentInvitation.objects.create(
                institution=institution,
                email=email,
                first_name=row.get('first_name', ''),
                last_name=row.get('last_name', ''),
                group_name=row.get('group_name', '')
            )
        
        return Response({
            'message': f'Импорт завершён. Создано пользователей: {created_count}, уже существовало: {invited_count}',
            'errors': errors
        }, status=status.HTTP_201_CREATED)

# ---------- ПУБЛИЧНОЕ ПОРТФОЛИО ВОЛОНТЁРА ----------
class PublicVolunteerProfileView(generics.RetrieveAPIView):
    queryset = VolunteerProfile.objects.all()
    serializer_class = PublicVolunteerProfileSerializer
    permission_classes = [permissions.AllowAny]  # Доступно без авторизации

class InstitutionReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'educational_institution':
            return Response({'error': 'Доступ только для учебных заведений'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            institution = request.user.institution_profile
        except EducationalInstitution.DoesNotExist:
            return Response({'error': 'Профиль учебного заведения не найден'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Получаем всех волонтёров, у которых institution = это учебное заведение
        volunteers = VolunteerProfile.objects.filter(institution=institution).select_related('user')
        
        report_data = []
        for volunteer in volunteers:
            user = volunteer.user
            total_hours = sum(p.hours for p in volunteer.participations.filter(verified=True))
            skills = [{'name': vs.skill.name, 'level': vs.level} for vs in volunteer.skills.all()]
            participations = volunteer.participations.filter(verified=True).select_related('event')
            events = [{
                'title': p.event.title,
                'hours': p.hours,
                'date': p.event.date_start.isoformat(),
                'organizer': p.event.organizer_organization.name if p.event.organizer_organization else
                             p.event.organizer_institution.name if p.event.organizer_institution else ''
            } for p in participations]
            
            report_data.append({
                'id': volunteer.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'group_name': volunteer.group_name,
                'phone': user.phone or '',
                'total_hours': total_hours,
                'skills': skills,
                'participations': events
            })
        
        return Response(report_data, status=status.HTTP_200_OK)
