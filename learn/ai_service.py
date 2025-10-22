# ai_service.py (Fully Optimized)
import os
import groq
import json
import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from django.conf import settings

# Set up logging
logger = logging.getLogger(__name__)

class GroqRoadmapAI:
    def __init__(self):
        self.api_key = self._get_api_key()
        self.client = groq.Client(api_key=self.api_key) if self.api_key else None
        self.roadmap_cache = {}
        self.request_timeout = 30  # seconds
        
        if self.client:
            logger.info("✅ Groq AI Service initialized successfully")
        else:
            logger.warning("⚠️ Groq AI Service running in fallback mode - no API key")
    
    def _get_api_key(self) -> Optional[str]:
        """Get API key from multiple sources with comprehensive fallbacks"""
        api_key = (
            os.environ.get("GROQ_API_KEY") or
            getattr(settings, 'GROQ_API_KEY', None) or
            self._load_from_env_file()
        )
        
        if not api_key:
            logger.error(
                "GROQ_API_KEY not found. Please set it in:\n"
                "1. Environment variables: export GROQ_API_KEY='your-key'\n"
                "2. Django settings: GROQ_API_KEY = 'your-key'\n"
                "3. .env file: GROQ_API_KEY=your-key"
            )
        elif len(api_key) < 20:  # Basic validation
            logger.error("GROQ_API_KEY appears to be invalid (too short)")
            return None
            
        return api_key
    
    def _load_from_env_file(self) -> Optional[str]:
        """Try to load API key from .env file"""
        try:
            from dotenv import load_dotenv
            load_dotenv()
            return os.environ.get("GROQ_API_KEY")
        except ImportError:
            logger.warning("python-dotenv not installed, skipping .env file")
        except Exception as e:
            logger.warning(f"Error loading .env file: {e}")
        return None
    
    def generate_roadmap(self, user_profile, roadmap_name: str) -> List[Dict[str, Any]]:
        """Generate personalized roadmap tasks based on user profile"""
        try:
            logger.info(f"🤖 Generating roadmap: {roadmap_name}")
            self._log_user_profile(user_profile)
            
            # Create cache key and check cache
            cache_key = self._create_cache_key(user_profile, roadmap_name)
            if cached_result := self.roadmap_cache.get(cache_key):
                logger.info("✅ Returning cached roadmap")
                return cached_result
            
            # Use AI or fallback
            if not self.client:
                logger.warning("⚠️ Using fallback tasks - no API client")
                return self._generate_personalized_default_tasks(user_profile, roadmap_name)
            
            return self._generate_ai_roadmap(user_profile, roadmap_name, cache_key)
            
        except Exception as e:
            logger.error(f"❌ Roadmap generation failed: {e}")
            return self._generate_personalized_default_tasks(user_profile, roadmap_name)
    
    def _log_user_profile(self, user_profile):
        """Log user profile details for debugging"""
        profile_info = (
            f"📍 Domain: {getattr(user_profile, 'technology_domain', 'N/A')}, "
            f"💻 Language: {getattr(user_profile, 'programming_language', 'N/A')}, "
            f"🛠️ Framework: {getattr(user_profile, 'framework', 'N/A')}, "
            f"🎯 Level: {getattr(user_profile, 'skill_level', 'N/A')}, "
            f"⏰ Time: {getattr(user_profile, 'time_commitment', 'N/A')}h/week"
        )
        logger.info(profile_info)
    
    def _generate_ai_roadmap(self, user_profile, roadmap_name: str, cache_key: str) -> List[Dict[str, Any]]:
        """Generate roadmap using Groq AI"""
        try:
            prompt = self._create_optimized_prompt(user_profile, roadmap_name)
            logger.info(f"📤 Sending request to Groq API (prompt: {len(prompt)} chars)")
            
            response = self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": self._get_optimized_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3500,
                top_p=0.9,
                timeout=self.request_timeout,
                response_format={"type": "json_object"}
            )
            
            ai_response = response.choices[0].message.content
            logger.info(f"📝 AI response received ({len(ai_response)} chars)")
            
            tasks_data = self._parse_and_enhance_response(ai_response, user_profile)
            
            if tasks_data:
                logger.info(f"✅ Generated {len(tasks_data)} AI-powered tasks")
                self.roadmap_cache[cache_key] = tasks_data
                return tasks_data
            else:
                raise ValueError("Failed to parse AI response")
                
        except groq.APIConnectionError as e:
            logger.error(f"❌ Groq API connection failed: {e}")
        except groq.RateLimitError as e:
            logger.error(f"❌ Groq API rate limit: {e}")
        except groq.AuthenticationError as e:
            logger.error(f"❌ Groq API authentication failed: {e}")
        except Exception as e:
            logger.error(f"❌ Groq API error: {e}")
        
        # Fallback to personalized defaults
        return self._generate_personalized_default_tasks(user_profile, roadmap_name)
    
    def _create_cache_key(self, user_profile, roadmap_name: str) -> str:
        """Create unique cache key based on user profile"""
        key_parts = [
            roadmap_name,
            getattr(user_profile, 'technology_domain', ''),
            getattr(user_profile, 'programming_language', ''),
            getattr(user_profile, 'framework', ''),
            getattr(user_profile, 'skill_level', ''),
            str(getattr(user_profile, 'time_commitment', 0)),
            (getattr(user_profile, 'learning_goals', '') or '')[:30]
        ]
        return "|".join(str(part).lower().replace(' ', '_') for part in key_parts)
    
    def _get_optimized_system_prompt(self) -> str:
        """Optimized system prompt for better AI responses"""
        return """You are an expert learning path designer. Create personalized, practical learning roadmaps.

CRITICAL: Return ONLY valid JSON with this exact structure:
{
  "tasks": [
    {
      "title": "Specific task title",
      "description": "Clear, actionable description",
      "category": "concept|language|framework|tool|project|practice|assessment",
      "estimated_hours": 8,
      "priority": "high|medium|low",
      "dependencies": ["previous task title"],
      "resources": [
        {
          "title": "Resource name",
          "url": "https://real-working-url.com",
          "type": "free|paid",
          "estimated_time": 60
        }
      ]
    }
  ]
}

GUIDELINES:
- Create 8-12 progressive tasks (beginner → advanced)
- Include hands-on projects and exercises
- Provide REAL documentation URLs
- Adapt to user's skill level and time commitment
- Make tasks specific and actionable
- Include varied learning types (reading, coding, projects)
- Ensure logical progression with dependencies"""
    
    def _create_optimized_prompt(self, user_profile, roadmap_name: str) -> str:
        """Create optimized prompt for AI"""
        # Safely get display values
        domain = self._get_display_value(user_profile, 'technology_domain')
        language = self._get_display_value(user_profile, 'programming_language', 'none')
        framework = self._get_display_value(user_profile, 'framework', 'none')
        skill_level = self._get_display_value(user_profile, 'skill_level')
        
        # Map skill levels for better AI understanding
        skill_map = {
            'absolute_beginner': 'absolute beginner (no coding experience)',
            'beginner': 'beginner (basic coding knowledge)',
            'intermediate': 'intermediate (comfortable with programming)',
            'advanced': 'advanced (experienced developer)'
        }
        
        learning_goals = getattr(user_profile, 'learning_goals', '') or 'master the technology stack'
        time_commitment = getattr(user_profile, 'time_commitment', 10)
        
        prompt = f"""
Create a learning roadmap for: {roadmap_name}

USER PROFILE:
- Technology Domain: {domain}
- Programming Language: {language if language != 'none' else 'most suitable language'}
- Framework: {framework if framework != 'none' else 'most relevant framework'}
- Skill Level: {skill_map.get(skill_level, skill_level)}
- Learning Goals: {learning_goals}
- Weekly Time: {time_commitment} hours

TASK REQUIREMENTS:
- Total tasks: 8-12
- Progressive difficulty
- Include: fundamentals, practical exercises, real project
- Focus on {domain} with {language} and {framework}
- Provide actual documentation URLs
- Make it suitable for {skill_map.get(skill_level, skill_level)}

Return valid JSON with tasks array.
"""
        return prompt.strip()
    
    def _get_display_value(self, user_profile, attr: str, none_value: str = '') -> str:
        """Safely get display value from user profile"""
        try:
            value = getattr(user_profile, attr, none_value)
            if hasattr(user_profile, f'get_{attr}_display'):
                return getattr(user_profile, f'get_{attr}_display')()
            return value
        except Exception:
            return getattr(user_profile, attr, none_value)
    
    def _parse_and_enhance_response(self, ai_response: str, user_profile) -> Optional[List[Dict[str, Any]]]:
        """Parse and enhance AI response with comprehensive validation"""
        try:
            cleaned_response = self._clean_ai_response(ai_response)
            
            # Extract JSON if embedded
            json_match = re.search(r'\{[\s\S]*\}', cleaned_response)
            if json_match:
                cleaned_response = json_match.group(0)
            
            data = json.loads(cleaned_response)
            tasks = data.get('tasks', [])
            
            if not tasks:
                logger.warning("⚠️ AI returned empty tasks list")
                return None
            
            validated_tasks = []
            for task in tasks:
                if self._validate_task(task):
                    enhanced_task = self._enhance_task_with_metadata(task, user_profile)
                    validated_tasks.append(enhanced_task)
            
            # Sort and finalize
            final_tasks = self._finalize_task_list(validated_tasks, user_profile)
            logger.info(f"📊 Validated {len(final_tasks)} tasks")
            return final_tasks
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            logger.debug(f"Problematic response: {ai_response[:500]}")
        except Exception as e:
            logger.error(f"❌ Response parsing error: {e}")
        
        return None
    
    def _clean_ai_response(self, response: str) -> str:
        """Thoroughly clean AI response"""
        if not response or not response.strip():
            return '{"tasks": []}'
        
        cleaned = response.strip()
        
        # Remove markdown code blocks
        cleaned = re.sub(r'```json\s*', '', cleaned)
        cleaned = re.sub(r'```\s*', '', cleaned)
        
        # Remove any XML/HTML tags
        cleaned = re.sub(r'<[^>]+>', '', cleaned)
        
        # Fix common JSON issues
        cleaned = re.sub(r',\s*}', '}', cleaned)  # Trailing commas
        cleaned = re.sub(r',\s*]', ']', cleaned)  # Trailing commas in arrays
        
        # Ensure it starts with {
        if not cleaned.startswith('{'):
            cleaned = '{' + cleaned.split('{', 1)[-1] if '{' in cleaned else '{"tasks": []}'
        
        return cleaned
    
    def _validate_task(self, task: Dict) -> bool:
        """Comprehensive task validation"""
        if not isinstance(task, dict):
            return False
        
        required_fields = ['title', 'description', 'category', 'estimated_hours']
        if not all(field in task for field in required_fields):
            return False
        
        # Validate field types and values
        if not isinstance(task['title'], str) or len(task['title'].strip()) < 5:
            return False
        
        if not isinstance(task['description'], str) or len(task['description'].strip()) < 10:
            return False
        
        valid_categories = ['concept', 'language', 'framework', 'tool', 'project', 'practice', 'assessment']
        if task.get('category') not in valid_categories:
            task['category'] = 'practice'
        
        try:
            hours = float(task['estimated_hours'])
            if hours <= 0 or hours > 100:  # Reasonable bounds
                return False
        except (ValueError, TypeError):
            return False
        
        return True
    
    def _enhance_task_with_metadata(self, task: Dict, user_profile) -> Dict[str, Any]:
        """Enhance task with additional metadata and validation"""
        # Ensure all required fields with defaults
        task.setdefault('priority', 'medium')
        task.setdefault('dependencies', [])
        task.setdefault('resources', [])
        
        # Validate and enhance resources
        if not task['resources'] or not isinstance(task['resources'], list):
            task['resources'] = self._get_smart_default_resources(task, user_profile)
        else:
            task['resources'] = self._validate_resources(task['resources'])
        
        # Add metadata
        task['ai_generated'] = True
        task['created_at'] = datetime.now().isoformat()
        task['version'] = '1.0'
        
        return task
    
    def _validate_resources(self, resources: List[Dict]) -> List[Dict]:
        """Validate and clean resources"""
        valid_resources = []
        for resource in resources:
            if (isinstance(resource, dict) and 
                resource.get('title') and 
                resource.get('url')):
                
                # Clean URL
                resource['url'] = self._clean_resource_url(resource['url'])
                resource.setdefault('type', 'free')
                resource.setdefault('estimated_time', 30)
                
                valid_resources.append(resource)
        
        return valid_resources[:5]  # Limit to 5 resources per task
    
    def _clean_resource_url(self, url: str) -> str:
        """Clean and validate resource URLs"""
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Remove tracking parameters
        url = re.sub(r'[?&](utm_[^&]+|gclid|fbclid)=[^&]*', '', url)
        url = re.sub(r'[?&]+$', '', url)  # Remove trailing ? or &
        
        return url
    
    def _get_smart_default_resources(self, task: Dict, user_profile) -> List[Dict]:
        """Get intelligent default resources based on task content"""
        category = task.get('category', 'practice')
        title_lower = task.get('title', '').lower()
        
        # Language-specific resources
        if category == 'language':
            lang = getattr(user_profile, 'programming_language', '')
            if lang and lang != 'none':
                return [{
                    'title': f'{self._get_display_value(user_profile, "programming_language")} Official Docs',
                    'url': self._get_language_doc_url(lang),
                    'type': 'free',
                    'estimated_time': 60
                }]
        
        # Framework-specific resources
        elif category == 'framework':
            framework = getattr(user_profile, 'framework', '')
            if framework and framework != 'none':
                return [{
                    'title': f'{self._get_display_value(user_profile, "framework")} Documentation',
                    'url': self._get_framework_doc_url(framework),
                    'type': 'free',
                    'estimated_time': 60
                }]
        
        # Project resources
        elif category == 'project':
            return [{
                'title': 'Project Ideas & Best Practices',
                'url': 'https://github.com/practical-tutorials/project-based-learning',
                'type': 'free',
                'estimated_time': 45
            }]
        
        # General learning resources
        return [{
            'title': 'Interactive Learning Platform',
            'url': 'https://www.freecodecamp.org/learn/',
            'type': 'free',
            'estimated_time': 45
        }]
    
    def _finalize_task_list(self, tasks: List[Dict], user_profile) -> List[Dict]:
        """Finalize and optimize task list"""
        if not tasks:
            return self._generate_personalized_default_tasks(user_profile, "fallback")
        
        # Sort by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        tasks.sort(key=lambda x: priority_order.get(x.get('priority', 'medium'), 1))
        
        # Ensure reasonable task count
        ideal_count = min(12, max(6, getattr(user_profile, 'time_commitment', 10) // 2))
        if len(tasks) > ideal_count:
            tasks = tasks[:ideal_count]
        elif len(tasks) < 6:
            # Supplement with defaults if needed
            default_tasks = self._generate_personalized_default_tasks(user_profile, "supplement")
            existing_titles = {t['title'] for t in tasks}
            
            for default_task in default_tasks:
                if default_task['title'] not in existing_titles and len(tasks) < ideal_count:
                    tasks.append(default_task)
        
        return tasks
    
    def _generate_personalized_default_tasks(self, user_profile, roadmap_name: str) -> List[Dict[str, Any]]:
        """Generate high-quality personalized fallback tasks"""
        domain = self._get_display_value(user_profile, 'technology_domain')
        language = self._get_display_value(user_profile, 'programming_language', 'none')
        framework = self._get_display_value(user_profile, 'framework', 'none')
        skill_level = getattr(user_profile, 'skill_level', 'beginner')
        time_commitment = getattr(user_profile, 'time_commitment', 10)
        
        # Skill-appropriate base tasks
        base_tasks = self._get_skill_adjusted_tasks(domain, language, framework, skill_level)
        
        # Add technology-specific tasks
        tech_tasks = self._get_technology_focused_tasks(domain, language, framework, skill_level)
        base_tasks.extend(tech_tasks)
        
        # Add practice and projects
        practice_tasks = self._get_practice_and_project_tasks(domain, time_commitment, skill_level)
        base_tasks.extend(practice_tasks)
        
        # Optimize task count based on time commitment
        optimal_count = min(10, max(6, time_commitment // 3))
        return base_tasks[:optimal_count]
    
    def _get_skill_adjusted_tasks(self, domain: str, language: str, framework: str, skill_level: str) -> List[Dict]:
        """Get tasks adjusted for skill level"""
        if skill_level == 'absolute_beginner':
            return [
                {
                    'title': f'Understanding {domain} Fundamentals',
                    'description': f'Learn the basic concepts and purpose of {domain} development',
                    'category': 'concept',
                    'estimated_hours': 8,
                    'priority': 'high',
                    'dependencies': [],
                    'resources': self._get_default_resources('concept'),
                    'ai_generated': False
                },
                {
                    'title': 'Development Environment Setup',
                    'description': 'Install and configure essential development tools and IDE',
                    'category': 'tool',
                    'estimated_hours': 4,
                    'priority': 'high',
                    'dependencies': [],
                    'resources': self._get_default_resources('tool'),
                    'ai_generated': False
                }
            ]
        
        elif skill_level == 'beginner':
            return [
                {
                    'title': f'{domain} Core Concepts Deep Dive',
                    'description': f'Master the fundamental principles and patterns of {domain}',
                    'category': 'concept',
                    'estimated_hours': 12,
                    'priority': 'high',
                    'dependencies': [],
                    'resources': self._get_default_resources('concept'),
                    'ai_generated': False
                }
            ]
        
        else:  # intermediate/advanced
            return [
                {
                    'title': f'Advanced {domain} Architecture',
                    'description': f'Explore advanced architectural patterns and best practices in {domain}',
                    'category': 'concept',
                    'estimated_hours': 15,
                    'priority': 'high',
                    'dependencies': [],
                    'resources': self._get_default_resources('concept'),
                    'ai_generated': False
                }
            ]
    
    def _get_technology_focused_tasks(self, domain: str, language: str, framework: str, skill_level: str) -> List[Dict]:
        """Get technology-specific tasks"""
        tasks = []
        
        if language != 'none':
            lang_display = language
            tasks.append({
                'title': f'Master {lang_display} Essentials',
                'description': f'Comprehensive coverage of {lang_display} syntax, features, and best practices',
                'category': 'language',
                'estimated_hours': 25 if skill_level == 'absolute_beginner' else 18,
                'priority': 'high',
                'dependencies': [],
                'resources': [{
                    'title': f'{lang_display} Official Documentation',
                    'url': self._get_language_doc_url(language),
                    'type': 'free',
                    'estimated_time': 120
                }],
                'ai_generated': False
            })
        
        if framework != 'none':
            framework_display = framework
            deps = [f'Master {language} Essentials'] if language != 'none' else []
            tasks.append({
                'title': f'{framework_display} Framework Mastery',
                'description': f'Learn to build robust applications using {framework_display}',
                'category': 'framework',
                'estimated_hours': 30,
                'priority': 'high',
                'dependencies': deps,
                'resources': [{
                    'title': f'{framework_display} Official Docs',
                    'url': self._get_framework_doc_url(framework),
                    'type': 'free',
                    'estimated_time': 150
                }],
                'ai_generated': False
            })
        
        return tasks
    
    def _get_practice_and_project_tasks(self, domain: str, time_commitment: int, skill_level: str) -> List[Dict]:
        """Get practice and project tasks"""
        project_hours = min(50, max(20, time_commitment * 2))
        
        return [
            {
                'title': 'Hands-on Coding Practice',
                'description': 'Solidify concepts through practical coding exercises and challenges',
                'category': 'practice',
                'estimated_hours': max(12, time_commitment),
                'priority': 'high',
                'dependencies': [],
                'resources': [{
                    'title': 'Interactive Coding Platform',
                    'url': 'https://exercism.org/',
                    'type': 'free',
                    'estimated_time': time_commitment * 40
                }],
                'ai_generated': False
            },
            {
                'title': f'Build a Real {domain} Project',
                'description': f'Create a complete, portfolio-worthy {domain} application',
                'category': 'project',
                'estimated_hours': project_hours,
                'priority': 'medium',
                'dependencies': ['Hands-on Coding Practice'],
                'resources': [{
                    'title': 'Project-Based Learning Guide',
                    'url': 'https://github.com/practical-tutorials/project-based-learning',
                    'type': 'free',
                    'estimated_time': 60
                }],
                'ai_generated': False
            },
            {
                'title': 'Testing and Deployment',
                'description': 'Learn professional testing strategies and deployment techniques',
                'category': 'practice',
                'estimated_hours': 10,
                'priority': 'medium',
                'dependencies': [f'Build a Real {domain} Project'],
                'resources': [{
                    'title': 'Software Testing Guide',
                    'url': 'https://www.freecodecamp.org/news/test-driven-development-tutorial/',
                    'type': 'free',
                    'estimated_time': 90
                }],
                'ai_generated': False
            }
        ]
    
    def _get_default_resources(self, category: str) -> List[Dict]:
        """Get default resources for fallback tasks"""
        resources = {
            'concept': [{
                'title': 'Comprehensive Learning Guide',
                'url': 'https://www.freecodecamp.org/learn/',
                'type': 'free',
                'estimated_time': 60
            }],
            'tool': [{
                'title': 'Development Setup Guide',
                'url': 'https://code.visualstudio.com/docs/setup/setup-overview',
                'type': 'free',
                'estimated_time': 45
            }]
        }
        return resources.get(category, [{
            'title': 'Learning Resources',
            'url': 'https://www.freecodecamp.org/learn/',
            'type': 'free',
            'estimated_time': 45
        }])
    
    def _get_language_doc_url(self, language: str) -> str:
        """Get documentation URL for programming language"""
        urls = {
            'python': 'https://docs.python.org/3/tutorial/',
            'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
            'java': 'https://docs.oracle.com/javase/tutorial/',
            'cpp': 'https://en.cppreference.com/w/',
            'csharp': 'https://docs.microsoft.com/en-us/dotnet/csharp/',
            'go': 'https://golang.org/doc/',
            'rust': 'https://doc.rust-lang.org/book/',
            'php': 'https://www.php.net/manual/en/',
            'ruby': 'https://ruby-doc.org/',
            'swift': 'https://docs.swift.org/swift-book/',
            'kotlin': 'https://kotlinlang.org/docs/',
            'dart': 'https://dart.dev/guides',
            'r': 'https://cran.r-project.org/manuals.html',
            'sql': 'https://www.w3schools.com/sql/',
            'typescript': 'https://www.typescriptlang.org/docs/'
        }
        return urls.get(language, 'https://www.freecodecamp.org/learn/')
    
    def _get_framework_doc_url(self, framework: str) -> str:
        """Get documentation URL for framework"""
        urls = {
            'react': 'https://react.dev/learn',
            'vue': 'https://vuejs.org/guide/',
            'angular': 'https://angular.io/docs',
            'django': 'https://docs.djangoproject.com/',
            'flask': 'https://flask.palletsprojects.com/',
            'express': 'https://expressjs.com/',
            'spring': 'https://spring.io/guides',
            'laravel': 'https://laravel.com/docs',
            'rails': 'https://guides.rubyonrails.org/',
            'flutter': 'https://flutter.dev/docs',
            'pytorch': 'https://pytorch.org/docs/',
            'tensorflow': 'https://www.tensorflow.org/learn',
            'fastapi': 'https://fastapi.tiangolo.com/',
            'pandas': 'https://pandas.pydata.org/docs/'
        }
        return urls.get(framework, 'https://www.freecodecamp.org/learn/')
    
    def clear_cache(self):
        """Clear the roadmap cache"""
        self.roadmap_cache.clear()
        logger.info("🧹 Roadmap cache cleared")
    
    def get_cache_info(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            'cache_size': len(self.roadmap_cache),
            'cache_keys': list(self.roadmap_cache.keys()),
            'api_available': bool(self.client)
        }


# Utility function for easy usage
def generate_roadmap(user_profile, roadmap_name: str) -> List[Dict[str, Any]]:
    """Convenience function to generate roadmap"""
    ai_service = GroqRoadmapAI()
    return ai_service.generate_roadmap(user_profile, roadmap_name) 