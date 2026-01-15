import { microAppSDK } from '@micro-fe/fragment-elements/sdk';
import { Component, createSignal, onMount } from 'solid-js';

interface UserProfile {
  email: string;
  joinedDate: string;
  name: string;
  role: string;
}

const Profile: Component = () => {
  const [profile, setProfile] = createSignal<UserProfile>({
    email: '',
    joinedDate: '',
    name: '',
    role: '',
  });

  const [isEditing, setIsEditing] = createSignal(false);

  onMount(() => {
    microAppSDK.registerMethod('updateProfile', async (params) => {
      const newProfile = params as Partial<UserProfile>;
      setProfile({ ...profile(), ...newProfile });
      return { success: true };
    });

    const mockProfile: UserProfile = {
      email: 'john.doe@example.com',
      joinedDate: '2024-01-15',
      name: 'John Doe',
      role: 'Developer',
    };

    setProfile(mockProfile);
    microAppSDK.emit('profile-loaded', mockProfile);
  });

  const toggleEdit = () => {
    setIsEditing(!isEditing());

    if (isEditing()) {
      microAppSDK.emit('profile-edit-started');
    } else {
      microAppSDK.emit('profile-updated', profile());
      microAppSDK.notifyStateChange({ page: 'profile', profile: profile() });
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile({ ...profile(), [field]: value });
  };

  return (
    <div class="page">
      <h2>User Profile</h2>
      <p>Manage your account information</p>

      <div class="card">
        <div class="profile-header">
          <h3>Profile Information</h3>
          <button onClick={toggleEdit} class="btn-secondary">
            {isEditing() ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        <div class="profile-form">
          <div class="form-group">
            <label class="form-label">Name</label>
            {isEditing() ? (
              <input
                type="text"
                class="form-input"
                value={profile().name}
                onInput={(e) => handleInputChange('name', e.currentTarget.value)}
              />
            ) : (
              <div class="form-value">{profile().name}</div>
            )}
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            {isEditing() ? (
              <input
                type="email"
                class="form-input"
                value={profile().email}
                onInput={(e) => handleInputChange('email', e.currentTarget.value)}
              />
            ) : (
              <div class="form-value">{profile().email}</div>
            )}
          </div>

          <div class="form-group">
            <label class="form-label">Role</label>
            {isEditing() ? (
              <input
                type="text"
                class="form-input"
                value={profile().role}
                onInput={(e) => handleInputChange('role', e.currentTarget.value)}
              />
            ) : (
              <div class="form-value">{profile().role}</div>
            )}
          </div>

          <div class="form-group">
            <label class="form-label">Joined Date</label>
            <div class="form-value">{profile().joinedDate}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>SDK Methods</h3>
        <p>This page registered a method 'updateProfile' that can be called by the parent application.</p>
        <pre class="code-block">
          {`microApp.call('updateProfile', { name: 'Jane Doe' })`}
        </pre>
      </div>

      <style>
        {`
          .page {
            max-width: 800px;
            margin: 0 auto;
          }

          .card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .card h3 {
            margin-top: 0;
            color: #2c7a7b;
          }

          .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
          }

          .profile-header h3 {
            margin: 0;
          }

          .profile-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-label {
            font-weight: 600;
            color: #4a5568;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .form-value {
            padding: 0.75rem 0;
            color: #2d3748;
            font-size: 1rem;
          }

          .form-input {
            padding: 0.75rem;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            font-size: 1rem;
            transition: border-color 0.2s;
          }

          .form-input:focus {
            outline: none;
            border-color: #2c7a7b;
            box-shadow: 0 0 0 3px rgba(44, 122, 123, 0.1);
          }

          .btn-secondary {
            background: white;
            color: #2c7a7b;
            border: 2px solid #2c7a7b;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            transition: all 0.2s;
          }

          .btn-secondary:hover {
            background: #2c7a7b;
            color: white;
          }

          .code-block {
            background: #2d3748;
            color: #68d391;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
          }
        `}
      </style>
    </div>
  );
};

export default Profile;
