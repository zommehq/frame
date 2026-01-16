import { CommonModule } from "@angular/common";
import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { frameSDK } from "@zomme/fragment-frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";

interface FormData {
  email: string;
  message: string;
  name: string;
  subject: string;
}

@Component({
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  selector: "app-contact",
  standalone: true,
  styleUrls: ["./contact.component.css"],
  templateUrl: "./contact.component.html",
})
export class ContactComponent {
  formData = signal<FormData>({
    email: "",
    message: "",
    name: "",
    subject: "",
  });

  submitMessage = signal("");
  submitSuccess = signal(false);

  handleSubmit() {
    this.submitMessage.set("Message sent successfully! (This is a demo)");
    this.submitSuccess.set(true);

    frameSDK.emit("contact-form-submitted", {
      ...this.formData(),
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      this.submitMessage.set("");
      this.formData.set({
        email: "",
        message: "",
        name: "",
        subject: "",
      });
    }, 3000);
  }

  // Getters and setters for ngModel binding
  get name(): string {
    return this.formData().name;
  }

  set name(value: string) {
    this.formData.update((data) => ({ ...data, name: value }));
  }

  get email(): string {
    return this.formData().email;
  }

  set email(value: string) {
    this.formData.update((data) => ({ ...data, email: value }));
  }

  get subject(): string {
    return this.formData().subject;
  }

  set subject(value: string) {
    this.formData.update((data) => ({ ...data, subject: value }));
  }

  get message(): string {
    return this.formData().message;
  }

  set message(value: string) {
    this.formData.update((data) => ({ ...data, message: value }));
  }
}
