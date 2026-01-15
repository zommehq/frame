import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1>Users Management</h1>
      <p>Manage users in the Angular fragment-frame.</p>

      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge">{{ user.role }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 1000px;
      }

      h1 {
        color: #2c3e50;
        margin-bottom: 1rem;
      }

      p {
        color: #666;
        margin-bottom: 2rem;
      }

      .users-table {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: #f8f9fa;
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #495057;
        border-bottom: 2px solid #dee2e6;
      }

      td {
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover {
        background: #f8f9fa;
      }

      .role-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #3498db;
        color: white;
        border-radius: 12px;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class UsersComponent implements OnInit {
  users: User[] = [];

  ngOnInit() {
    this.users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' },
      { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'User' },
    ];
  }
}
