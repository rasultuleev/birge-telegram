from rest_framework import serializers
from .models import (
    User, Organization, EducationalInstitution, VolunteerProfile,
    Skill, Event, Participation, VerificationCode, StudentInvitation
)
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    volunteer_profile_id = serializers.IntegerField(source='volunteer_profile.id', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'is_verified', 'phone', 'first_name', 'last_name', 'volunteer_profile_id')

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'
        read_only_fields = ('user',)

class EducationalInstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationalInstitution
        fields = '__all__'
        read_only_fields = ('user',)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'role', 'phone')

    def create(self, validated_data):
        phone = validated_data.get('phone', '')
        if phone is None:
            phone = ''
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'volunteer'),
            phone=phone
        )
        if user.role in ['organization', 'educational_institution']:
            user.is_staff = True
            user.save()
        # Автоматическое создание профиля волонтёра
        if user.role == 'volunteer':
            VolunteerProfile.objects.get_or_create(user=user)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError('Неверные данные для входа')

class ProfileSerializer(serializers.ModelSerializer):
    volunteer_profile_id = serializers.IntegerField(source='volunteer_profile.id', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'is_verified', 'phone', 'first_name', 'last_name', 'volunteer_profile_id')

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Skill.objects.all(), source='skills'
    )

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ('code', 'organizer_organization', 'organizer_institution')

    def create(self, validated_data):
        skills = validated_data.pop('skills', [])
        request = self.context.get('request')
        user = request.user
        if user.role == 'organization':
            try:
                org = user.organization_profile
                event = Event.objects.create(organizer_organization=org, **validated_data)
            except Organization.DoesNotExist:
                raise serializers.ValidationError('У вас нет профиля организации')
        elif user.role == 'educational_institution':
            try:
                inst = user.institution_profile
                event = Event.objects.create(organizer_institution=inst, **validated_data)
            except EducationalInstitution.DoesNotExist:
                raise serializers.ValidationError('У вас нет профиля учебного заведения')
        else:
            raise serializers.ValidationError('Вы не можете создавать мероприятия')
        event.skills.set(skills)
        return event

class ParticipationSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.StringRelatedField(source='volunteer.user.email', read_only=True)

    class Meta:
        model = Participation
        fields = '__all__'
        read_only_fields = ('volunteer', 'event', 'registered_at')

class StudentInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentInvitation
        fields = '__all__'
        read_only_fields = ('institution', 'sent_at', 'accepted')

class PublicVolunteerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    institution_name = serializers.SerializerMethodField()
    group_name = serializers.CharField(source='group_name')
    skills = serializers.SerializerMethodField()
    total_hours = serializers.SerializerMethodField()
    participations = serializers.SerializerMethodField()

    class Meta:
        model = VolunteerProfile
        fields = ('id', 'full_name', 'email', 'phone', 'institution_name', 'group_name',
                  'skills', 'total_hours', 'participations')

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_email(self, obj):
        return obj.user.email

    def get_phone(self, obj):
        return obj.user.phone or ''

    def get_institution_name(self, obj):
        return obj.institution.name if obj.institution else ''

    def get_skills(self, obj):
        return [{'name': vs.skill.name, 'level': vs.level} for vs in obj.skills.all()]

    def get_total_hours(self, obj):
        return sum(p.hours for p in obj.participations.filter(verified=True))

    def get_participations(self, obj):
        participations = obj.participations.filter(verified=True).select_related('event')
        return [{
            'event_title': p.event.title,
            'hours': p.hours,
            'date': p.event.date_start.isoformat(),
            'organizer': p.event.organizer_organization.name if p.event.organizer_organization else
                         p.event.organizer_institution.name if p.event.organizer_institution else ''
        } for p in participations]
