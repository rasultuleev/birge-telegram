from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import UserManager

class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    ROLE_CHOICES = (
        ('volunteer', 'Волонтёр'),
        ('organization', 'Организация'),
        ('educational_institution', 'Учебное заведение'),
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='volunteer')
    
    is_verified = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    objects = UserManager()
    
    def __str__(self):
        return self.email

class Organization(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='organization_profile')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=300, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    def __str__(self):
        return self.name

class EducationalInstitution(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='institution_profile')
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    def __str__(self):
        return self.name

class VolunteerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')
    institution = models.ForeignKey(EducationalInstitution, on_delete=models.SET_NULL, null=True, blank=True)
    group_name = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"{self.user.email} (волонтёр)"

class Skill(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return self.name

class VolunteerSkill(models.Model):
    volunteer = models.ForeignKey(VolunteerProfile, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    level = models.IntegerField(choices=[(0, '0'), (1, '1'), (2, '2'), (3, '3')], default=0)
    
    class Meta:
        unique_together = ('volunteer', 'skill')
    
    def __str__(self):
        return f"{self.volunteer.user.email} - {self.skill.name} ({self.level})"

class Event(models.Model):
    organizer_organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    organizer_institution = models.ForeignKey(EducationalInstitution, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    date_start = models.DateTimeField()
    date_end = models.DateTimeField()
    max_hours = models.PositiveIntegerField(default=4)
    code = models.CharField(max_length=50, unique=True, blank=True)
    skills = models.ManyToManyField(Skill, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.code:
            import uuid
            self.code = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.title

class Participation(models.Model):
    volunteer = models.ForeignKey(VolunteerProfile, on_delete=models.CASCADE, related_name='participations')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participations')
    hours = models.PositiveIntegerField(default=0)
    verified = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('volunteer', 'event')
    
    def __str__(self):
        return f"{self.volunteer.user.email} - {self.event.title}"

class VerificationCode(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.email} - {self.code}"

class StudentInvitation(models.Model):
    institution = models.ForeignKey(EducationalInstitution, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    group_name = models.CharField(max_length=100, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.email} -> {self.institution.name}"
