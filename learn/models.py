from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import User

class UserProfile(models.Model):
    # Domain Choices
    TECH_CHOICES = [
        ('web', '🌐 Web Development'),
        ('mobile', '📱 Mobile Development'), 
        ('data', '📊 Data Science'),
        ('ai', '🤖 AI & Machine Learning'),
        ('cloud', '☁️ Cloud Computing'),
        ('cyber', '🔒 Cybersecurity'),
    ]
    
    # Programming Languages (organized by domain)
    PROGRAMMING_LANGUAGES = [
        # Web Development Languages
        ('javascript', 'JavaScript'),
        ('python', 'Python'),
        ('java', 'Java'),
        ('php', 'PHP'),
        ('ruby', 'Ruby'),
        ('csharp', 'C#'),
        ('go', 'Go'),
        
        # Mobile Development Languages
        ('swift', 'Swift'),
        ('kotlin', 'Kotlin'),
        ('dart', 'Dart'),
        
        # Data Science Languages
        ('r', 'R'),
        ('sql', 'SQL'),
        ('julia', 'Julia'),
        ('scala', 'Scala'),
        
        # AI & Cybersecurity Languages
        ('cpp', 'C++'),
        ('c', 'C'),
        
        # Default
        ('none', 'Not Sure / Start with Basics'),
    ]
    
    # Frameworks (organized by language)
    FRAMEWORKS = [
        # Python Frameworks
        ('django', 'Django'),
        ('flask', 'Flask'),
        ('fastapi', 'FastAPI'),
        ('pytorch', 'PyTorch'),
        ('tensorflow', 'TensorFlow'),
        ('pandas', 'Pandas'),
        
        # JavaScript Frameworks
        ('react', 'React'),
        ('vue', 'Vue.js'),
        ('angular', 'Angular'),
        ('express', 'Express.js'),
        ('nextjs', 'Next.js'),
        ('nestjs', 'NestJS'),
        
        # Java Frameworks
        ('spring', 'Spring Boot'),
        ('hibernate', 'Hibernate'),
        
        # PHP Frameworks
        ('laravel', 'Laravel'),
        
        # Ruby Frameworks
        ('rails', 'Ruby on Rails'),
        
        # .NET Frameworks
        ('aspnet', 'ASP.NET'),
        
        # Mobile Frameworks
        ('flutter', 'Flutter'),
        
        # Default
        ('none', 'No Framework / Learn Language First'),
    ]
    
    LEVELS = [
        ('beginner', '🚀 Beginner - Just starting out'),
        ('intermediate', '⚡ Intermediate - Some experience'),
        ('advanced', '🎯 Advanced - Comfortable with coding'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    
    # Step-by-step selections
    technology_domain = models.CharField(max_length=20, choices=TECH_CHOICES, blank=True)
    programming_language = models.CharField(max_length=50, choices=PROGRAMMING_LANGUAGES, default='none')
    framework = models.CharField(max_length=50, choices=FRAMEWORKS, default='none')
    skill_level = models.CharField(max_length=15, choices=LEVELS, blank=True)
    
    learning_goals = models.TextField(blank=True)
    time_commitment = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Track completion of steps (1=domain, 2=language, 3=framework, 4=level, 5=complete)
    step_completed = models.IntegerField(default=1)
    
    
    def is_profile_complete(self):
        return self.step_completed == 5
    
    def __str__(self):
        return f"{self.name} - {self.get_technology_domain_display()}"
    
    def get_available_languages(self):
        """Get languages available for selected domain"""
        domain_language_map = {
            'web': ['javascript', 'python', 'java', 'php', 'ruby', 'csharp', 'go'],
            'mobile': ['swift', 'kotlin', 'dart', 'java', 'javascript'],
            'data': ['python', 'r', 'sql', 'julia', 'scala'],
            'ai': ['python', 'r', 'julia', 'cpp'],
            'cloud': ['python', 'go', 'java', 'csharp'],
            'cyber': ['python', 'c', 'cpp', 'java'],
        }
        
        if self.technology_domain in domain_language_map:
            available_codes = domain_language_map[self.technology_domain]
            return [choice for choice in self.PROGRAMMING_LANGUAGES if choice[0] in available_codes]
        
        return self.PROGRAMMING_LANGUAGES
    
    def get_available_frameworks(self):
        """Get frameworks available for selected language"""
        language_framework_map = {
            'python': ['django', 'flask', 'fastapi', 'pytorch', 'tensorflow', 'pandas'],
            'javascript': ['react', 'vue', 'angular', 'express', 'nextjs', 'nestjs'],
            'java': ['spring', 'hibernate'],
            'php': ['laravel'],
            'ruby': ['rails'],
            'csharp': ['aspnet'],
            'dart': ['flutter'],
        }
        
        if self.programming_language in language_framework_map:
            available_codes = language_framework_map[self.programming_language]
            return [choice for choice in self.FRAMEWORKS if choice[0] in available_codes]
        
        return self.FRAMEWORKS

class Roadmap(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='roadmaps')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.user_profile.name}"
    
    def save(self, *args, **kwargs):
        if not self.name:
            count = Roadmap.objects.filter(user_profile=self.user_profile).count()
            self.name = f"Roadmap {count + 1}"
        super().save(*args, **kwargs)

class RoadmapTask(models.Model):
    CATEGORIES = [
        ('language', 'Language'), 
        ('framework', 'Framework'), 
        ('tool', 'Tool'), 
        ('project', 'Project'),
        ('concept', 'Concept'),
        ('practice', 'Practice Exercise')
    ]
    
    roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORIES)
    estimated_hours = models.IntegerField(default=10)
    completed = models.BooleanField(default=False)
    dependencies = ArrayField(models.IntegerField(), blank=True, default=list)
    ai_generated = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class LearningResource(models.Model):
    task = models.ForeignKey(RoadmapTask, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200)
    url = models.URLField()
    resource_type = models.CharField(max_length=20, default='free')
    estimated_time = models.IntegerField(default=60)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title