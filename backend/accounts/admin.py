from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['email', 'username']
    ordering = ['-created_at']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'bio', 'avatar')}),
    )

admin.site.register(User, CustomUserAdmin)