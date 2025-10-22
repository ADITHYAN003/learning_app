from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Roadmap, RoadmapTask, LearningResource

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    available_languages = serializers.SerializerMethodField()
    available_frameworks = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at']
    
    def get_available_languages(self, obj):
        """Get available languages for current domain"""
        languages = obj.get_available_languages()
        return [{'value': code, 'label': label} for code, label in languages]
    
    def get_available_frameworks(self, obj):
        """Get available frameworks for current language"""
        frameworks = obj.get_available_frameworks()
        return [{'value': code, 'label': label} for code, label in frameworks]

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'name']
    
    def create(self, validated_data):
        name = validated_data.pop('name')
        email = validated_data.pop('email')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=email,
            password=validated_data['password']
        )
        
        UserProfile.objects.create(
            user=user,
            name=name,
            email=email
        )
        return user

class LearningResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningResource
        fields = '__all__'

class RoadmapTaskSerializer(serializers.ModelSerializer):
    resources = LearningResourceSerializer(many=True, read_only=True)
    
    class Meta:
        model = RoadmapTask
        fields = '__all__'

class RoadmapSerializer(serializers.ModelSerializer):
    tasks = RoadmapTaskSerializer(many=True, read_only=True)
    user_profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Roadmap
        fields = '__all__'