import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Save, X } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Profile = () => {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.firstName && formData.firstName.length > 50) {
      newErrors.firstName = 'First name must be less than 50 characters';
    }

    if (formData.lastName && formData.lastName.length > 50) {
      newErrors.lastName = 'Last name must be less than 50 characters';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await updateProfile(formData);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-error bg-error-light';
      case 'user':
        return 'text-accent bg-accent-light';
      case 'read-only':
        return 'text-warning bg-warning-light';
      default:
        return 'text-muted bg-tertiary';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'user':
        return '👤';
      case 'read-only':
        return '👁️';
      default:
        return '❓';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Profile</h1>
          <p className="text-secondary mt-1">
            Manage your account information
          </p>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover transition"
          >
            <User className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-primary rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-primary">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.username
                }
              </h2>
              <p className="text-secondary">@{user.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleIcon(user.role)} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-primary mb-1">
                First Name
              </label>
              {isEditing ? (
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition ${
                    errors.firstName
                      ? 'border-error focus:ring-error focus:border-error'
                      : 'border-border-color'
                  }`}
                  placeholder="Enter your first name"
                />
              ) : (
                <p className="px-3 py-2 text-primary bg-secondary rounded-md">
                  {user.firstName || 'Not provided'}
                </p>
              )}
              {errors.firstName && (
                <p className="mt-1 text-sm text-error">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-primary mb-1">
                Last Name
              </label>
              {isEditing ? (
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition ${
                    errors.lastName
                      ? 'border-error focus:ring-error focus:border-error'
                      : 'border-border-color'
                  }`}
                  placeholder="Enter your last name"
                />
              ) : (
                <p className="px-3 py-2 text-primary bg-secondary rounded-md">
                  {user.lastName || 'Not provided'}
                </p>
              )}
              {errors.lastName && (
                <p className="mt-1 text-sm text-error">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
              Email Address
            </label>
            {isEditing ? (
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition ${
                  errors.email
                    ? 'border-error focus:ring-error focus:border-error'
                    : 'border-border-color'
                }`}
                placeholder="Enter your email"
              />
            ) : (
              <p className="px-3 py-2 text-primary bg-secondary rounded-md flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted" />
                {user.email}
              </p>
            )}
            {errors.email && (
              <p className="mt-1 text-sm text-error">{errors.email}</p>
            )}
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Username
              </label>
              <p className="px-3 py-2 text-primary bg-secondary rounded-md flex items-center gap-2">
                <User className="w-4 h-4 text-muted" />
                {user.username}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Account Type
              </label>
              <p className="px-3 py-2 text-primary bg-secondary rounded-md flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted" />
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)} User
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t border-border-color">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <div className="spinner w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-border-color text-secondary rounded-md hover:text-primary hover:bg-secondary transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Account Information */}
      <div className="bg-primary rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary">Member since</span>
            <span className="text-primary font-medium">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary">Permissions</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role === 'admin' ? 'Full Access' : 
                 user.role === 'user' ? 'Manage Own Data' : 
                 'View Only'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
