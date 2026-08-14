from django.contrib import admin
from .models import (
    User, Organization, EducationalInstitution, VolunteerProfile,
    Skill, VolunteerSkill, Event, Participation, VerificationCode
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'is_verified', 'is_staff')
    search_fields = ('email',)
    list_filter = ('role', 'is_verified', 'is_staff')

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'phone')
    search_fields = ('name', 'user__email')

@admin.register(EducationalInstitution)
class EducationalInstitutionAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'phone')
    search_fields = ('name', 'user__email')

@admin.register(VolunteerProfile)
class VolunteerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'institution', 'group_name')
    search_fields = ('user__email',)

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    search_fields = ('name',)

@admin.register(VolunteerSkill)
class VolunteerSkillAdmin(admin.ModelAdmin):
    list_display = ('volunteer', 'skill', 'level')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date_start', 'date_end', 'max_hours')
    search_fields = ('title', 'code')
    list_filter = ('date_start',)

@admin.register(Participation)
class ParticipationAdmin(admin.ModelAdmin):
    list_display = ('volunteer', 'event', 'hours', 'verified')
    list_filter = ('verified',)

@admin.register(VerificationCode)
class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('email', 'code', 'created_at', 'is_used')
    list_filter = ('is_used',)
