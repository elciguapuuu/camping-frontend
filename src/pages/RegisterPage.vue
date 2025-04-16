<template>
  <div class="register">
    <h2>Register</h2>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <input 
          type="text" 
          v-model="name" 
          placeholder="Name"
          :class="{ 'invalid': nameError }"
        >
        <div v-if="nameError" class="validation-error">{{ nameError }}</div>
      </div>
      
      <div class="form-group">
        <input 
          type="email" 
          v-model="email" 
          placeholder="Email"
          :class="{ 'invalid': emailError }"
        >
        <div v-if="emailError" class="validation-error">{{ emailError }}</div>
      </div>
      
      <div class="form-group">
        <input 
          type="password" 
          v-model="password" 
          placeholder="Password"
          :class="{ 'invalid': passwordError }"
        >
        <div v-if="passwordError" class="validation-error">{{ passwordError }}</div>
        <div class="password-requirements">
          Password must be at least 8 characters and include:
          <ul>
            <li>One uppercase letter (A-Z)</li>
            <li>One lowercase letter (a-z)</li>
            <li>One number (0-9)</li>
            <li>One special character (@$!%*?&)</li>
          </ul>
        </div>
      </div>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Registering...' : 'Register' }}
      </button>
    </form>
    
    <div class="social-login">
      <p>Or register with:</p>
      <button @click="registerWithGoogle" class="google-btn">Google</button>
    </div>
    
    <p>Already have an account? <router-link to="/login">Login</router-link></p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RegisterPage',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      nameError: '',
      emailError: '',
      passwordError: '',
      errorMessage: '',
      isLoading: false
    }
  },
  methods: {
    validateName() {
      if (!this.name) {
        this.nameError = 'Name is required';
        return false;
      } else if (this.name.length < 2) {
        this.nameError = 'Name must be at least 2 characters long';
        return false;
      }
      this.nameError = '';
      return true;
    },
    
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.email) {
        this.emailError = 'Email is required';
        return false;
      } else if (!emailRegex.test(this.email)) {
        this.emailError = 'Invalid email format';
        return false;
      }
      this.emailError = '';
      return true;
    },
    
    validatePassword() {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!this.password) {
        this.passwordError = 'Password is required';
        return false;
      } else if (!passwordRegex.test(this.password)) {
        this.passwordError = 'Password does not meet requirements';
        return false;
      }
      this.passwordError = '';
      return true;
    },
    
    async handleRegister() {
      // Reset error messages
      this.errorMessage = '';
      
      // Validate inputs
      const isNameValid = this.validateName();
      const isEmailValid = this.validateEmail();
      const isPasswordValid = this.validatePassword();
      
      if (!isNameValid || !isEmailValid || !isPasswordValid) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        const response = await axios.post('http://localhost:3001/auth/register', {
          name: this.name,
          email: this.email,
          password: this.password
        });
        
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to home
        this.$router.push('/');
        
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.error || 'Registration failed. Please try again.';
        } else {
          this.errorMessage = 'Network error. Please check your connection.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    registerWithGoogle() {
      window.location.href = 'http://localhost:3001/auth/google';
    }
  }
}
</script>

<style scoped>
.register {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

input.invalid {
  border-color: #ff5252;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #ff5252;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #ffeded;
  border-radius: 4px;
}

.validation-error {
  color: #ff5252;
  font-size: 0.8rem;
  margin-bottom: 5px;
}

.password-requirements {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
  text-align: left;
}

.password-requirements ul {
  padding-left: 20px;
  margin-top: 5px;
  margin-bottom: 0;
}

.social-login {
  margin-top: 20px;
  text-align: center;
}

.google-btn {
  background-color: #4285F4;
}
</style>
