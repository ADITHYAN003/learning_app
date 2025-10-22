from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # JWT Authentication
    path('auth/register/', views.UserRegistrationView.as_view(), ),
    path('auth/login/', views.UserLoginView.as_view(), ),
    path('auth/logout/', views.UserLogoutView.as_view(), ),
    path('auth/token/refresh/', TokenRefreshView.as_view(), ),
    path('auth/me/', views.CurrentUserView.as_view(), ),
    
    # Profile Setup
    path('profile/progress/', views.ProfileProgressView.as_view(), ),
    path('profile/step1/domain/', views.Step1DomainView.as_view(), ),
    path('profile/step2/language/', views.Step2LanguageView.as_view(), ),
    path('profile/step3/framework/', views.Step3FrameworkView.as_view(), ),
    path('profile/step4/level/', views.Step4SkillLevelView.as_view(), ),

    # Roadmaps
    path('profiles/<int:profile_id>/roadmaps/', views.RoadmapListView.as_view(), ),
    path('profiles/<int:profile_id>/roadmaps/create/', views.RoadmapCreateView.as_view(), ),
    path('roadmaps/<int:pk>/', views.RoadmapDetailView.as_view(), ),

    # Tasks
    path('roadmaps/<int:roadmap_id>/tasks/', views.RoadmapTaskListCreateView.as_view(), ),
    path('tasks/<int:pk>/', views.RoadmapTaskDetailView.as_view(), ),
    path('tasks/<int:task_id>/toggle/', views.ToggleTaskCompleteView.as_view(), ),

    # Resources
    path('tasks/<int:task_id>/resources/', views.LearningResourceListCreateView.as_view(), ),
    path('resources/<int:pk>/', views.LearningResourceDetailView.as_view(), ),
    path('resources/<int:resource_id>/toggle/', views.ToggleResourceCompleteView.as_view(), ),

    path('roadmaps/additional-path/', views.AdditionalPathView.as_view(), ),
    path('roadmaps/path-configuration/', views.PathConfigurationView.as_view(), ),
]