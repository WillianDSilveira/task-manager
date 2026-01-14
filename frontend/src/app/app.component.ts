import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

interface Task {
  id?: number;
  title: string;
  description: string;
  status: 'pending' | 'completed';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // 1. Definição das Propriedades (Resolvendo erros TS2339)
  tasks: Task[] = [];
  newTask: Task = { title: '', description: '', status: 'pending' };
  apiUrl = 'http://localhost:3000/api/tasks';
  aiUrl = 'http://localhost:3000/api/ai/suggest';
  loadingAi = false;

  // 2. Construtor (Resolvendo erro TS2304 de HttpClient)
  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {}

  // 3. Inicialização (Resolvendo erro TS2420 de OnInit)
  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.http.get<Task[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.tasks = data;
        this.cd.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar tarefas:', err)
    });
  }

  addTask() {
    if (!this.newTask.title) return;
    this.http.post<Task>(this.apiUrl, this.newTask).subscribe({
      next: () => {
        this.loadTasks();
        this.newTask = { title: '', description: '', status: 'pending' };
        this.cd.detectChanges();
      },
      error: (err) => console.error('Erro ao adicionar tarefa:', err)
    });
  }

  suggestDescription() {
    if (!this.newTask.title) return;

    this.loadingAi = true;
    this.cd.detectChanges();

    this.http.post<{ suggestion: string }>(this.aiUrl, { taskTitle: this.newTask.title })
      .subscribe({
        next: (res: { suggestion: string }) => {
          this.newTask.description = res.suggestion;
          this.loadingAi = false;
          this.cd.detectChanges(); // Resolve a necessidade do segundo clique
        },
        error: (err) => {
          console.error('Erro na IA:', err);
          alert('Erro ao consultar a IA. Tente novamente.');
          this.loadingAi = false;
          this.cd.detectChanges();
        }
      });
  }

  toggleStatus(task: Task) {
    const updatedTask = { ...task, status: task.status === 'pending' ? 'completed' : 'pending' };
    this.http.put(`${this.apiUrl}/${task.id}`, updatedTask).subscribe({
      next: () => this.loadTasks(),
      error: (err) => console.error('Erro ao atualizar tarefa:', err)
    });
  }

  deleteTask(id: number) {
    if (confirm('Deseja excluir esta tarefa?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => this.loadTasks(),
        error: (err) => console.error('Erro ao deletar tarefa:', err)
      });
    }
  }
}
