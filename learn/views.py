from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .models import UserProfile, Roadmap, RoadmapTask, LearningResource
from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer, 
    RoadmapSerializer, RoadmapTaskSerializer, LearningResourceSerializer,
    UserSerializer
)
from .ai_service import GroqRoadmapAI


# ========== AUTHENTICATION VIEWS ==========
class UserRegistrationView(generics.CreateAPIView):
    """User registration with JWT tokens"""
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            profile = UserProfile.objects.get(user=user)
            
            return Response({
                'user': UserSerializer(user).data,
                'profile': UserProfileSerializer(profile).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """User login with JWT tokens"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Login attempt - Username: {username}")
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            refresh = RefreshToken.for_user(user)
            profile = get_object_or_404(UserProfile, user=user)
            
            return Response({
                'user': UserSerializer(user).data,
                'profile': UserProfileSerializer(profile).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'Login successful'
            })
        
        return Response(
            {'error': 'Invalid username or password'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )


class UserLogoutView(APIView):
    """Simple user logout - just clear client-side tokens"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        return Response({"message": "Logout successful - clear tokens from client storage"}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """Get current user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        profile = get_object_or_404(UserProfile, user=request.user)
        return Response({
            'user': UserSerializer(request.user).data,
            'profile': UserProfileSerializer(profile).data
        })


# ========== PROFILE SETUP VIEWS ==========
class ProfileProgressView(APIView):
    """Get user's profile progress"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        profile = get_object_or_404(UserProfile, user=request.user)
        
        progress_data = {
            'current_step': profile.step_completed,
            'completed': profile.step_completed == 5,
            'selected': {
                'domain': {
                    'value': profile.technology_domain,
                    'label': profile.get_technology_domain_display() if profile.technology_domain else None
                },
                'language': {
                    'value': profile.programming_language,
                    'label': profile.get_programming_language_display()
                },
                'framework': {
                    'value': profile.framework,
                    'label': profile.get_framework_display()
                },
                'skill_level': {
                    'value': profile.skill_level,
                    'label': profile.get_skill_level_display() if profile.skill_level else None
                }
            }
        }
        
        return Response(progress_data)


class Step1DomainView(APIView):
    """Step 1: Domain selection"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get domain options"""
        domains = [
            {'value': 'web', 'label': '🌐 Web Development'},
            {'value': 'mobile', 'label': '📱 Mobile Development'},
            {'value': 'data', 'label': '📊 Data Science'},
            {'value': 'ai', 'label': '🤖 AI & Machine Learning'},
            {'value': 'cloud', 'label': '☁️ Cloud Computing'},
            {'value': 'cyber', 'label': '🔒 Cybersecurity'},
        ]
        return Response({'domains': domains})
    
    def post(self, request):
        """Save domain selection"""
        profile = get_object_or_404(UserProfile, user=request.user)
        domain = request.data.get('domain')
        
        if not domain:
            return Response({'error': 'Domain is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile.technology_domain = domain
        profile.step_completed = 2
        profile.save()
        
        return Response({
            'message': 'Domain selected successfully',
            'next_step': 'language',
            'current_step': 2
        })


class Step2LanguageView(APIView):
    """Step 2: Language selection"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get language options based on domain"""
        profile = get_object_or_404(UserProfile, user=request.user)
        
        if not profile.technology_domain:
            return Response({'error': 'Please select a domain first'}, status=status.HTTP_400_BAD_REQUEST)
        
        domain_languages = {
            'web': ['javascript', 'python', 'java', 'php', 'ruby', 'csharp', 'go'],
            'mobile': ['swift', 'kotlin', 'dart', 'java', 'javascript'],
            'data': ['python', 'r', 'sql', 'julia', 'scala'],
            'ai': ['python', 'r', 'julia', 'cpp'],
            'cloud': ['python', 'go', 'java', 'csharp'],
            'cyber': ['python', 'c', 'cpp', 'java'],
        }
        
        languages = domain_languages.get(profile.technology_domain, [])
        language_choices = [{'value': lang, 'label': lang.capitalize()} for lang in languages]
        
        return Response({'languages': language_choices})
    
    def post(self, request):
        """Save language selection"""
        profile = get_object_or_404(UserProfile, user=request.user)
        language = request.data.get('language')
        
        if not profile.technology_domain:
            return Response({'error': 'Please select a domain first'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not language:
            return Response({'error': 'Language is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile.programming_language = language
        profile.step_completed = 3
        profile.save()
        
        return Response({
            'message': 'Language selected successfully',
            'next_step': 'framework',
            'current_step': 3
        })


class Step3FrameworkView(APIView):
    """Step 3: Framework selection"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get framework options based on language"""
        profile = get_object_or_404(UserProfile, user=request.user)
        
        if not profile.programming_language:
            return Response({'error': 'Please select a language first'}, status=status.HTTP_400_BAD_REQUEST)
        
        language_frameworks = {
            'python': ['django', 'flask', 'fastapi', 'pytorch', 'tensorflow', 'pandas'],
            'javascript': ['react', 'vue', 'angular', 'express', 'nextjs', 'nestjs'],
            'java': ['spring', 'hibernate'],
            'php': ['laravel'],
            'ruby': ['rails'],
            'csharp': ['aspnet'],
            'dart': ['flutter'],
        }
        
        frameworks = language_frameworks.get(profile.programming_language, [])
        framework_choices = [{'value': fw, 'label': fw.capitalize()} for fw in frameworks]
        framework_choices.append({'value': 'none', 'label': 'No Framework'})
        
        return Response({'frameworks': framework_choices})
    
    def post(self, request):
        """Save framework selection"""
        profile = get_object_or_404(UserProfile, user=request.user)
        framework = request.data.get('framework', 'none')
        
        if not profile.programming_language:
            return Response({'error': 'Please select a language first'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile.framework = framework
        profile.step_completed = 4
        profile.save()
        
        return Response({
            'message': 'Framework selection saved',
            'next_step': 'skill_level',
            'current_step': 4
        })


class Step4SkillLevelView(APIView):
    """Step 4: Skill level selection"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get skill level options"""
        levels = [
            {'value': 'beginner', 'label': '🚀 Beginner'},
            {'value': 'intermediate', 'label': '⚡ Intermediate'},
            {'value': 'advanced', 'label': '🎯 Advanced'},
        ]
        return Response({'levels': levels})
    
    def post(self, request):
        """Save skill level and complete profile"""
        profile = get_object_or_404(UserProfile, user=request.user)
        skill_level = request.data.get('skill_level')
        learning_goals = request.data.get('learning_goals', '')
        time_commitment = request.data.get('time_commitment', 10)
        
        if not skill_level:
            return Response({'error': 'Skill level is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile.skill_level = skill_level
        profile.learning_goals = learning_goals
        profile.time_commitment = time_commitment
        profile.step_completed = 5
        profile.save()
        
        return Response({
            'message': 'Profile setup completed successfully!',
            'next_step': 'dashboard',
            'current_step': 5,
            'profile_complete': True
        })


# ========== ROADMAP VIEWS ==========
class RoadmapListView(generics.ListAPIView):
    """List all roadmaps for user"""
    serializer_class = RoadmapSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        profile_id = self.kwargs.get('profile_id')
        profile = get_object_or_404(UserProfile, id=profile_id, user=self.request.user)
        return Roadmap.objects.filter(user_profile=profile).order_by('-created_at')


class RoadmapCreateView(APIView):
    """Create AI-generated roadmap"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, profile_id):
        try:
            user_profile = get_object_or_404(UserProfile, id=profile_id, user=request.user)
            
            # Generate roadmap name
            roadmap_name = self._generate_roadmap_name(user_profile)
            
            # Create roadmap
            roadmap = Roadmap.objects.create(
                user_profile=user_profile,
                name=roadmap_name,
                description=f"AI-generated learning path for {user_profile.get_technology_domain_display()}"
            )
            
            # Generate AI tasks
            ai = GroqRoadmapAI()
            tasks_data = ai.generate_roadmap(user_profile, roadmap.name)
            
            if not tasks_data:
                roadmap.delete()
                return Response({
                    'error': 'Failed to generate roadmap tasks'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Create tasks and resources
            created_tasks = self._create_tasks_and_resources(roadmap, tasks_data)
            
            serializer = RoadmapSerializer(roadmap)
            
            return Response({
                'roadmap': serializer.data,
                'message': 'Roadmap generated successfully',
                'summary': {
                    'total_tasks': len(created_tasks),
                    'total_resources': sum(len(task.resources.all()) for task in created_tasks),
                    'estimated_total_hours': sum(task.estimated_hours for task in created_tasks)
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Failed to create roadmap',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _generate_roadmap_name(self, user_profile):
        """Generate automatic roadmap name"""
        tech_stack = []
        if user_profile.programming_language != 'none':
            tech_stack.append(user_profile.get_programming_language_display())
        if user_profile.framework != 'none':
            tech_stack.append(user_profile.get_framework_display())
        
        if tech_stack:
            name = f"{user_profile.get_technology_domain_display()} with {' & '.join(tech_stack)}"
        else:
            name = f"{user_profile.get_technology_domain_display()} Learning Path"
        
        existing_count = Roadmap.objects.filter(user_profile=user_profile).count()
        if existing_count > 0:
            name = f"{name} {existing_count + 1}"
        
        return name
    
    def _create_tasks_and_resources(self, roadmap, tasks_data):
        """Create tasks and resources from AI data"""
        created_tasks = []
        
        for task_data in tasks_data:
            task = RoadmapTask.objects.create(
                roadmap=roadmap,
                title=task_data.get('title', 'Learning Task'),
                description=task_data.get('description', 'Learn important concepts and skills'),
                category=task_data.get('category', 'concept'),
                estimated_hours=task_data.get('estimated_hours', 10),
                ai_generated=True
            )
            created_tasks.append(task)
            
            # Create resources
            resources = task_data.get('resources', [])
            for res in resources:
                LearningResource.objects.create(
                    task=task,
                    title=res.get('title', 'Learning Resource'),
                    url=res.get('url', 'https://example.com'),
                    resource_type=res.get('type', 'free'),
                    estimated_time=res.get('estimated_time', 60)
                )
        
        return created_tasks


class RoadmapDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete roadmap"""
    serializer_class = RoadmapSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Roadmap.objects.filter(user_profile__user=self.request.user)


# ========== TASK & RESOURCE VIEWS ==========
class RoadmapTaskListCreateView(generics.ListCreateAPIView):
    """List and create roadmap tasks"""
    serializer_class = RoadmapTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        roadmap_id = self.kwargs['roadmap_id']
        roadmap = get_object_or_404(Roadmap, id=roadmap_id, user_profile__user=self.request.user)
        return RoadmapTask.objects.filter(roadmap=roadmap)
    
    def perform_create(self, serializer):
        roadmap = get_object_or_404(Roadmap, id=self.kwargs['roadmap_id'], user_profile__user=self.request.user)
        serializer.save(roadmap=roadmap, ai_generated=False)


class RoadmapTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete roadmap task"""
    serializer_class = RoadmapTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return RoadmapTask.objects.filter(roadmap__user_profile__user=self.request.user)


class LearningResourceListCreateView(generics.ListCreateAPIView):
    """List and create learning resources"""
    serializer_class = LearningResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.kwargs['task_id']
        task = get_object_or_404(RoadmapTask, id=task_id, roadmap__user_profile__user=self.request.user)
        return LearningResource.objects.filter(task=task)
    
    def perform_create(self, serializer):
        task = get_object_or_404(RoadmapTask, id=self.kwargs['task_id'], roadmap__user_profile__user=self.request.user)
        serializer.save(task=task)


class LearningResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete learning resource"""
    serializer_class = LearningResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LearningResource.objects.filter(task__roadmap__user_profile__user=self.request.user)


# ========== ACTION VIEWS ==========
class ToggleTaskCompleteView(APIView):
    """Toggle task completion status"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, task_id):
        task = get_object_or_404(RoadmapTask, id=task_id, roadmap__user_profile__user=request.user)
        task.completed = not task.completed
        task.save()
        return Response({'completed': task.completed})


class ToggleResourceCompleteView(APIView):
    """Toggle resource completion status"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, resource_id):
        resource = get_object_or_404(LearningResource, id=resource_id, task__roadmap__user_profile__user=request.user)
        resource.completed = not resource.completed
        resource.save()
        return Response({'completed': resource.completed})


class AdditionalPathView(APIView):
    """Create additional learning path for the same user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Create a new learning path with different focus"""
        try:
            profile = get_object_or_404(UserProfile, user=request.user)
            
            # Get the new path configuration from request
            new_domain = request.data.get('technology_domain')
            new_language = request.data.get('programming_language', 'none')
            new_framework = request.data.get('framework', 'none')
            new_skill_level = request.data.get('skill_level', profile.skill_level)
            learning_goals = request.data.get('learning_goals', '')
            time_commitment = request.data.get('time_commitment', profile.time_commitment)
            
            print(f"Creating additional path for user {request.user.username}")
            print(f"Domain: {new_domain}, Language: {new_language}, Framework: {new_framework}")
            
            if not new_domain:
                return Response(
                    {'error': 'Technology domain is required for new path'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate roadmap name for the new path
            roadmap_name = self._generate_path_name(new_domain, new_language, new_framework, profile)
            
            # Create new roadmap first
            roadmap = Roadmap.objects.create(
                user_profile=profile,
                name=roadmap_name,
                description=f"Additional learning path for {self._get_domain_display(new_domain)}"
            )
            
            print(f"Created roadmap: {roadmap.name}")
            
            # Generate AI tasks - this should always work
            ai = GroqRoadmapAI()
            temp_profile = self._create_complete_temp_profile(
                new_domain, new_language, new_framework, new_skill_level, 
                learning_goals, time_commitment
            )
            
            # AI service should handle all task generation
            tasks_data = ai.generate_roadmap(temp_profile, roadmap.name)
            
            if not tasks_data:
                # If AI returns empty, delete the roadmap and return error
                roadmap.delete()
                return Response({
                    'error': 'AI service failed to generate roadmap tasks. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Create tasks and resources from AI data
            created_tasks = self._create_tasks_and_resources(roadmap, tasks_data)
            
            serializer = RoadmapSerializer(roadmap)
            
            return Response({
                'roadmap': serializer.data,
                'message': 'Additional learning path created successfully with AI-generated content',
                'summary': {
                    'total_tasks': len(created_tasks),
                    'total_resources': sum(len(task.resources.all()) for task in created_tasks),
                    'estimated_total_hours': sum(task.estimated_hours for task in created_tasks)
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating additional path: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response({
                'error': 'Failed to create additional learning path',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _create_complete_temp_profile(self, domain, language, framework, skill_level, learning_goals, time_commitment):
        """Create a complete temporary profile with ALL methods that UserProfile has"""
        class CompleteTempProfile:
            def __init__(self, domain, language, framework, skill_level, learning_goals, time_commitment):
                self.technology_domain = domain
                self.programming_language = language
                self.framework = framework
                self.skill_level = skill_level
                self.learning_goals = learning_goals
                self.time_commitment = time_commitment
                self.step_completed = 5
                self.name = "Additional Path User"
                self.email = "additional@example.com"
            
            def get_technology_domain_display(self):
                domains = dict(UserProfile.TECH_CHOICES)
                return domains.get(self.technology_domain, self.technology_domain.capitalize())
            
            def get_programming_language_display(self):
                languages = dict(UserProfile.PROGRAMMING_LANGUAGES)
                return languages.get(self.programming_language, self.programming_language.capitalize())
            
            def get_framework_display(self):
                frameworks = dict(UserProfile.FRAMEWORKS)
                return frameworks.get(self.framework, self.framework.capitalize())
            
            def get_skill_level_display(self):
                levels = dict(UserProfile.LEVELS)
                return levels.get(self.skill_level, self.skill_level.capitalize())
            
            def is_profile_complete(self):
                return True
            
            def __str__(self):
                return f"Additional Path - {self.get_technology_domain_display()}"
        
        return CompleteTempProfile(domain, language, framework, skill_level, learning_goals, time_commitment)
    
    def _create_tasks_and_resources(self, roadmap, tasks_data):
        """Create tasks and resources from AI data"""
        created_tasks = []
        
        for task_data in tasks_data:
            try:
                task = RoadmapTask.objects.create(
                    roadmap=roadmap,
                    title=task_data.get('title', 'Learning Task'),
                    description=task_data.get('description', 'Learn important concepts'),
                    category=task_data.get('category', 'concept'),
                    estimated_hours=task_data.get('estimated_hours', 10),
                    ai_generated=True  # Mark as AI-generated
                )
                created_tasks.append(task)
                
                # Create resources if available
                resources = task_data.get('resources', [])
                for res in resources:
                    LearningResource.objects.create(
                        task=task,
                        title=res.get('title', 'Learning Resource'),
                        url=res.get('url', 'https://example.com'),
                        resource_type=res.get('type', 'free'),
                        estimated_time=res.get('estimated_time', 60)
                    )
                    
            except Exception as e:
                print(f"Error creating task: {e}")
                continue
        
        return created_tasks
    
    def _generate_path_name(self, domain, language, framework, profile):
        """Generate name for the new path"""
        tech_stack = []
        if language != 'none':
            tech_stack.append(self._get_language_display(language))
        if framework != 'none':
            tech_stack.append(self._get_framework_display(framework))
        
        if tech_stack:
            base_name = f"{self._get_domain_display(domain)} with {' & '.join(tech_stack)}"
        else:
            base_name = f"{self._get_domain_display(domain)} Learning Path"
        
        existing_count = Roadmap.objects.filter(user_profile=profile).count()
        return f"{base_name} #{existing_count + 1}"
    
    def _get_domain_display(self, domain):
        domains = dict(UserProfile.TECH_CHOICES)
        return domains.get(domain, domain.capitalize())
    
    def _get_language_display(self, language):
        languages = dict(UserProfile.PROGRAMMING_LANGUAGES)
        return languages.get(language, language.capitalize())
    
    def _get_framework_display(self, framework):
        frameworks = dict(UserProfile.FRAMEWORKS)
        return frameworks.get(framework, framework.capitalize())


class PathConfigurationView(APIView):
    """Get available configurations for additional paths"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get all available domains, languages, and frameworks for new paths"""
        try:
            profile = get_object_or_404(UserProfile, user=request.user)
            
            # All available domains
            domains = [
                {'value': 'web', 'label': '🌐 Web Development'},
                {'value': 'mobile', 'label': '📱 Mobile Development'},
                {'value': 'data', 'label': '📊 Data Science'},
                {'value': 'ai', 'label': '🤖 AI & Machine Learning'},
                {'value': 'cloud', 'label': '☁️ Cloud Computing'},
                {'value': 'cyber', 'label': '🔒 Cybersecurity'},
            ]
            
            # All available languages organized by domain
            all_languages = [
                {'value': 'javascript', 'label': 'JavaScript', 'domains': ['web', 'mobile']},
                {'value': 'python', 'label': 'Python', 'domains': ['web', 'data', 'ai', 'cloud', 'cyber']},
                {'value': 'java', 'label': 'Java', 'domains': ['web', 'mobile', 'cloud', 'cyber']},
                {'value': 'php', 'label': 'PHP', 'domains': ['web']},
                {'value': 'ruby', 'label': 'Ruby', 'domains': ['web']},
                {'value': 'csharp', 'label': 'C#', 'domains': ['web', 'cloud']},
                {'value': 'go', 'label': 'Go', 'domains': ['web', 'cloud']},
                {'value': 'swift', 'label': 'Swift', 'domains': ['mobile']},
                {'value': 'kotlin', 'label': 'Kotlin', 'domains': ['mobile']},
                {'value': 'dart', 'label': 'Dart', 'domains': ['mobile']},
                {'value': 'r', 'label': 'R', 'domains': ['data', 'ai']},
                {'value': 'sql', 'label': 'SQL', 'domains': ['data']},
                {'value': 'julia', 'label': 'Julia', 'domains': ['data', 'ai']},
                {'value': 'scala', 'label': 'Scala', 'domains': ['data']},
                {'value': 'cpp', 'label': 'C++', 'domains': ['ai', 'cyber']},
                {'value': 'c', 'label': 'C', 'domains': ['cyber']},
            ]
            
            # All available frameworks organized by language
            all_frameworks = [
                {'value': 'django', 'label': 'Django', 'languages': ['python']},
                {'value': 'flask', 'label': 'Flask', 'languages': ['python']},
                {'value': 'fastapi', 'label': 'FastAPI', 'languages': ['python']},
                {'value': 'pytorch', 'label': 'PyTorch', 'languages': ['python']},
                {'value': 'tensorflow', 'label': 'TensorFlow', 'languages': ['python']},
                {'value': 'pandas', 'label': 'Pandas', 'languages': ['python']},
                {'value': 'react', 'label': 'React', 'languages': ['javascript']},
                {'value': 'vue', 'label': 'Vue.js', 'languages': ['javascript']},
                {'value': 'angular', 'label': 'Angular', 'languages': ['javascript']},
                {'value': 'express', 'label': 'Express.js', 'languages': ['javascript']},
                {'value': 'nextjs', 'label': 'Next.js', 'languages': ['javascript']},
                {'value': 'nestjs', 'label': 'NestJS', 'languages': ['javascript']},
                {'value': 'spring', 'label': 'Spring Boot', 'languages': ['java']},
                {'value': 'hibernate', 'label': 'Hibernate', 'languages': ['java']},
                {'value': 'laravel', 'label': 'Laravel', 'languages': ['php']},
                {'value': 'rails', 'label': 'Ruby on Rails', 'languages': ['ruby']},
                {'value': 'aspnet', 'label': 'ASP.NET', 'languages': ['csharp']},
                {'value': 'flutter', 'label': 'Flutter', 'languages': ['dart']},
            ]
            
            skill_levels = [
                {'value': 'beginner', 'label': '🚀 Beginner'},
                {'value': 'intermediate', 'label': '⚡ Intermediate'},
                {'value': 'advanced', 'label': '🎯 Advanced'},
            ]
            
            return Response({
                'domains': domains,
                'all_languages': all_languages,
                'all_frameworks': all_frameworks,
                'skill_levels': skill_levels,
                'current_profile': {
                    'domain': profile.technology_domain,
                    'language': profile.programming_language,
                    'framework': profile.framework,
                    'skill_level': profile.skill_level
                }
            })
            
        except Exception as e:
            print(f"Error in path configuration: {str(e)}")
            return Response({
                'error': 'Failed to load path configuration' 
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)