from django.urls import path
from .views import (
    RegisterView, LoginView, ProfileView, VerifyEmailView,
    EventListCreateView, EventDetailView, EventParticipantsView,
    VerifyParticipationView, SkillListView, ParticipateEventView,
    ImportStudentsView, PublicVolunteerProfileView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    
    path('events/', EventListCreateView.as_view(), name='event-list-create'),
    path('events/participate/', ParticipateEventView.as_view(), name='participate'),
    path('events/<int:pk>/', EventDetailView.as_view(), name='event-detail'),
    
    path('events/<int:event_id>/participants/', EventParticipantsView.as_view(), name='event-participants'),
    path('participations/<int:participation_id>/verify/', VerifyParticipationView.as_view(), name='verify-participation'),
    
    path('skills/', SkillListView.as_view(), name='skill-list'),
    
    path('institutions/import-students/', ImportStudentsView.as_view(), name='import-students'),
    
    path('volunteers/<int:pk>/', PublicVolunteerProfileView.as_view(), name='public-volunteer-profile'),
]
