from django.contrib import admin
from django.urls import path, include
from api import views as api_views   # <-- ЭТА СТРОЧКА ДОБАВЛЕНА

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('webhook/', api_views.telegram_webhook),
]