from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, Roadmap, RoadmapTask, LearningResource

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

class CustomUserAdmin(UserAdmin):
    inlines = [UserProfileInline]

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'technology_domain', 'programming_language', 'skill_level', 'step_completed']
    list_filter = ['technology_domain', 'skill_level', 'step_completed']
    search_fields = ['name', 'user__username']

@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = ['name', 'user_profile', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'user_profile__name']

@admin.register(RoadmapTask)
class RoadmapTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'roadmap', 'category', 'completed', 'estimated_hours']
    list_filter = ['category', 'completed', 'ai_generated']
    search_fields = ['title', 'roadmap__name']

@admin.register(LearningResource)
class LearningResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'task', 'resource_type', 'completed', 'estimated_time']
    list_filter = ['resource_type', 'completed']
    search_fields = ['title', 'task__title']

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)