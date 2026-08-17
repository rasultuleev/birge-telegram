from django.contrib import admin
from django.urls import path
from api.views import (
    RegisterView, LoginView, ProfileView, VerifyEmailView,
    EventListCreateView, EventDetailView, EventParticipantsView,
    VerifyParticipationView, SkillListView, ParticipateEventView,
    ImportStudentsView, PublicVolunteerProfileView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('api/events/', EventListCreateView.as_view(), name='event-list-create'),
    path('api/events/participate/', ParticipateEventView.as_view(), name='participate'),
    path('api/events/<int:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('api/events/<int:event_id>/participants/', EventParticipantsView.as_view(), name='event-participants'),
    path('api/participations/<int:participation_id>/verify/', VerifyParticipationView.as_view(), name='verify-participation'),
    path('api/skills/', SkillListView.as_view(), name='skill-list'),
    path('api/institutions/import-students/', ImportStudentsView.as_view(), name='import-students'),
    path('api/volunteers/<int:pk>/', PublicVolunteerProfileView.as_view(), name='public-volunteer-profile'),
]
