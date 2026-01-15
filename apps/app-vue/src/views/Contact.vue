<script setup lang="ts">
  import { useFrameSDK } from '../composables/useFrameSDK';
  import { reactive, ref } from 'vue';

  const { emit } = useFrameSDK();

  const formData = reactive({
    email: '',
    message: '',
    name: '',
    subject: '',
  });

  const submitMessage = ref('');
  const submitSuccess = ref(false);

  const handleSubmit = () => {
    submitMessage.value = 'Message sent successfully! (This is a demo)';
    submitSuccess.value = true;

    emit('contact-form-submitted', {
      ...formData,
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      submitMessage.value = '';
      Object.keys(formData).forEach((key) => {
        formData[key as keyof typeof formData] = '';
      });
    }, 3000);
  };
</script>

<template>
  <div class="view-container">
    <h1 class="title">Contact Us</h1>
    <div class="content">
      <div class="form-section">
        <p class="intro">
          Have questions about our Vue micro-frontend? Fill out the form below and we'll get back to you.
        </p>

        <form class="contact-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label" for="name">Name</label>
            <input
              id="name"
              v-model="formData.name"
              class="form-input"
              placeholder="Your name"
              required
              type="text"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model="formData.email"
              class="form-input"
              placeholder="your.email@example.com"
              required
              type="email"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="subject">Subject</label>
            <input
              id="subject"
              v-model="formData.subject"
              class="form-input"
              placeholder="What's this about?"
              required
              type="text"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="message">Message</label>
            <textarea
              id="message"
              v-model="formData.message"
              class="form-textarea"
              placeholder="Your message here..."
              required
              rows="6"
            ></textarea>
          </div>

          <button class="submit-button" type="submit">
            Send Message
          </button>
        </form>

        <div v-if="submitMessage" class="submit-message" :class="{ success: submitSuccess }">
          {{ submitMessage }}
        </div>
      </div>

      <div class="info-section">
        <h2>Other Ways to Reach Us</h2>
        <div class="contact-methods">
          <div class="contact-method">
            <h3>Email</h3>
            <p>support@vue-microapp.com</p>
          </div>
          <div class="contact-method">
            <h3>Documentation</h3>
            <p>Visit our docs for detailed guides</p>
          </div>
          <div class="contact-method">
            <h3>GitHub</h3>
            <p>Check out our open source repository</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .view-container {
    max-width: 1000px;
  }

  .title {
    color: #42b883;
    font-size: 2.5rem;
    margin-bottom: 2rem;
  }

  .content {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 768px) {
    .content {
      grid-template-columns: 1fr;
    }
  }

  .form-section {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    padding: 2rem;
  }

  .intro {
    color: #666;
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    color: #2c3e50;
    font-weight: 600;
  }

  .form-input,
  .form-textarea {
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
    padding: 0.75rem;
    transition: border-color 0.2s;
  }

  .form-input:focus,
  .form-textarea:focus {
    border-color: #42b883;
    outline: none;
  }

  .form-textarea {
    resize: vertical;
  }

  .submit-button {
    background-color: #42b883;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    padding: 0.875rem 1.5rem;
    transition: background-color 0.2s;
  }

  .submit-button:hover {
    background-color: #359268;
  }

  .submit-message {
    background-color: #f0f9ff;
    border-left: 4px solid #3b82f6;
    border-radius: 4px;
    color: #1e40af;
    margin-top: 1rem;
    padding: 1rem;
  }

  .submit-message.success {
    background-color: #f0fdf4;
    border-left-color: #42b883;
    color: #166534;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .info-section h2 {
    color: #2c3e50;
    font-size: 1.5rem;
  }

  .contact-methods {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .contact-method {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
  }

  .contact-method h3 {
    color: #42b883;
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
  }

  .contact-method p {
    color: #666;
    line-height: 1.5;
    margin: 0;
  }
</style>
