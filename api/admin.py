from django.contrib import admin
from .models import VerificationCode, ParticipantProfile, Skill, Event, Participation, ParticipantSkill

admin.site.register(VerificationCode)
admin.site.register(ParticipantProfile)
admin.site.register(Skill)
admin.site.register(Event)
admin.site.register(Participation)
admin.site.register(ParticipantSkill)