import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';




Chart.register(...registerables);

const API = 'http://localhost:3000/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})



export class DashboardComponent implements OnInit {



  nextIntentPage() {
    if (this.intentPage < this.intentTotalPages - 1) {
      this.intentPage++;
      this.loadIntents();

    }
  }

  prevIntentPage() {
    if (this.intentPage > 0) {
      this.intentPage--;
      this.loadIntents();
    }
  }


  sidebarCollapsed = false;
  activeTab = 'dashboard';
  modal: string | null = null;
  modalLoading = false;
  modalError = '';
  toast = '';
  toastType: 'success' | 'error' = 'success';
  editingId: number | null = null;
  editingKey: string | null = null;

  private statusChart: Chart | null = null;
  private courseChart: Chart | null = null;
  private modeChart: Chart | null = null;
  private faqChart:     Chart | null = null;
  private trainerChart: Chart | null = null;
  private timeChart: Chart | null = null;
  private referralStatusChart: Chart | null = null;
  private referralCourseChart: Chart | null = null;

  get pageTitle(): string {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      courses: 'Courses',
      faqs: 'FAQs',
      intents: 'Intents',
      trainers: 'Trainers',
      config: 'Bot Config',
      leads: 'Leads',
      referrals: 'Referrals',
      admins: 'Admin Management',
    };
    return titles[this.activeTab] ?? 'Dashboard';
  }


  stats = { courses: 0, faqs: 0, intents: 0, trainers: 0 ,leads: 0 };


  admins: any[] = [];

  adminForm = {
    username: '',
    password: ''
  };


  courses: any[] = [];
  coursePage = 0;
  courseTotal: number = 0;
  courseTotalPages = 1;
  courseFilter = { name: '', mode: '', isActive: '' };
 courseForm: any = {
   name: '',
   duration: '',
   skills: '',
   mode: '',
   highlights: '',
   status: true,

   batchTiming: '',
   nextBatchDate: '',
   brochureUrl: '',

   placementSupport: '',
   placementPercentage: '',
   highestPackage: '',
   hiringCompanies: '',
 };


  faqTotal: number = 0;
  faqs: any[] = [];
  faqPage = 0;
  faqTotalPages = 1;
  faqFilter = { question: '', isActive: '' };
  faqForm: any = {};


  intents: any[] = [];
  intentPage = 0;
  intentTotalPages = 1;
  intentForm: any = {};


  trainers: any[] = [];
  trainerPage = 0;
  trainerTotalPages = 1;
  trainerFilter = { name: '', specialization: '' };
  trainerForm: any = {};


  configs: any[] = [];
  configPage = 0;
  configTotalPages = 1;
  configFilter = { key: '' };
  configForm: any = {};


leads: any[] = [];
leadPage = 0;
leadTotalPages = 1;
leadFilter = { phone: '', status: '', requestType: '' };



referrals: any[] = [];
referralPage = 0;
referralTotalPages = 1;
referralFilter = { referrerPhone: '', referredPhone: '', status: '' };

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadStats();
    this.loadAdmins();
    this.loadIntents();
    this.loadFaqs();
    this.loadCourses();
    setTimeout(() => this.loadCharts(), 200);
  }



  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'courses') this.loadCourses();
    if (tab === 'faqs') this.loadFaqs();
    if (tab === 'intents') this.loadIntents();
    if (tab === 'trainers') this.loadTrainers();
    if (tab === 'config') this.loadConfigs();
    if (tab === 'leads') this.loadLeads();
    if (tab === 'referrals') this.loadReferrals();
    if (tab === 'dashboard') setTimeout(() => this.loadCharts(), 100);
    if (tab === 'intents') {
        this.intentPage = 0;
        this.loadIntents();
      }
  }



  logout() {
    this.auth.logout();
  }


  // loadStats() {
  //   this.http.get<any>(`${API}/courses?size=1`).subscribe(r => this.stats.courses = r.totalElements ?? 0);
  //   this.http.get<any>(`${API}/faqs?size=1`).subscribe(r => this.stats.faqs = r.totalElements ?? 0);
  //   this.http.get<any>(`${API}/intents?size=1`).subscribe(r => this.stats.intents = r.totalElements ?? 0);
  //   this.http.get<any>(`${API}/leads?size=1`).subscribe(r => this.stats.leads = r.totalElements ?? 0);
  //   this.http.get<any>(`${API}/trainers?size=1`).subscribe(r => { const body = r.data ?? r;this.stats.trainers=(r.data??[]).length;});
  // }

loadStats() {
  this.http.get<any[]>(`${API}/courses?page=0&size=1000`).subscribe(r => {
    this.stats.courses = (r ?? []).filter(c => c.status == true).length; // == not ===
  });

  this.http.get<any[]>(`${API}/faqs?page=0&size=1000`).subscribe(r => {
    this.stats.faqs = (r ?? []).filter(f => f.status == true).length;
  });

  this.http.get<any[]>(`${API}/intents?page=0&size=1000`).subscribe(r => {
    this.stats.intents = (r ?? []).filter(i => i.status == true).length;
  });

  this.http.get<any[]>(`${API}/leads?page=0&size=1000`).subscribe(r => {
    this.stats.leads = (r ?? []).length;
  });

  this.http.get<any>(`${API}/trainers?page=0&size=1000`).subscribe(r => {
    this.stats.trainers = (r.data ?? []).filter((t: any) => t.status == true).length;
  });
}


  loadAdmins() {
    this.http.get<any>(`${API}/admin/list`).subscribe({
      next: (res) => {
        this.admins = res?.data ?? res ?? [];
        console.log("ADMINS:", this.admins);
      },
      error: (err) => console.error(err)
    });
  }

  addAdmin() {
    if (!this.adminForm.username || !this.adminForm.password) {
      this.showToast('Enter username & password', 'error');
      return;
    }

    const payload = {
      username: this.adminForm.username,
      password: this.adminForm.password,
      role: 'ROLE_ADMIN',
      enabled: true
    };

    this.http.post(`${API}/admin/add`, payload)
      .subscribe({
        next: () => {
          this.showToast('Admin added!');
          this.adminForm = { username: '', password: '' };
          this.loadAdmins();
        },
        error: (err) => {
          console.log("ADMIN ERROR:", err);
          this.showToast(
            err?.error?.message || 'Failed to add admin',
            'error'
          );
        }
      });
  }

  toggleAdmin(id: number) {
    this.http.post(`${API}/admin/toggle/${id}`, {})
      .subscribe({
        next: () => {
          this.showToast('Admin updated');
          this.loadAdmins();
        },
        error: () => this.showToast('Error updating admin', 'error')
      });
  }


 loadCourses() {
   let url = `${API}/courses?page=${this.coursePage}&size=8`;

   if (this.courseFilter.name)
     url += `&name=${this.courseFilter.name}`;

   if (this.courseFilter.mode)
     url += `&mode=${this.courseFilter.mode}`;

   if (this.courseFilter.isActive !== '')
     url += `&isActive=${this.courseFilter.isActive}`;

   this.http.get<any>(url).subscribe({
     next: (res) => {

       console.log("COURSE RESPONSE:", res);

       this.stats.courses = res.total || 0;
       this.courses = res.data ?? [];
       this.courseTotalPages = res.totalPages ?? 1;
       this.courseTotal = res.total ?? 0;

     },
     error: (err) => {
       console.error("Course API error:", err);
       this.courses = [];
       this.courseTotalPages = 1;
     }
   });
 }



  editCourse(c: any) {
    this.editingId = c.id;
    this.courseForm = { ...c };
    this.modal = 'course';
  }

  saveCourse() {
    if (!this.courseForm.name || !this.courseForm.mode) {
      this.modalError = 'Name and Mode are required.';
      return;
    }
    this.modalLoading = true;
    this.modalError = '';
    const req = this.editingId
      ? this.http.put(`${API}/courses/${this.editingId}`, this.courseForm)
      : this.http.post(`${API}/courses`, this.courseForm);

    req.subscribe({
      next: () => { this.closeModal(); this.loadCourses(); this.loadStats(); this.showToast('Course saved!'); },
      error: () => { this.modalLoading = false; this.modalError = 'Save failed. Check your input.'; }
    });
  }

toggleCourseStatus(c:any){
this.http.patch(`${API}/courses/${c.id}/status?status=${!c.status}`,{},{responseType:'text'})
.subscribe({
next:()=>{
c.status=!c.status;
this.loadStats();
this.showToast('Status updated!');
},
error:()=>this.showToast('Failed to toggle status.','error')
});
}

  deleteCourse(id: number) {
    if (!confirm('Delete this course?')) return;

    this.http.delete(`${API}/courses/${id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.courses = this.courses.filter(c => c.id !== id); // instant UI
          this.showToast('Course deleted.');
        },
        error: () => this.showToast('Delete failed.', 'error')
      });
  }


loadFaqs() {
  this.http.get<any>(
    `${API}/faqs?page=${this.faqPage}&size=8`
  ).subscribe({
    next: (res) => {

      console.log("FAQ RESPONSE:", res);


      this.stats.faqs = res.total || 0;

      this.faqs = res.data ?? res ?? [];

      this.faqTotal = res.total ?? this.faqs.length ?? 0;
      this.faqTotalPages = res.totalPages ?? 1;

    },
    error: (err) => {
      console.error("FAQ API error:", err);
      this.faqs = [];
    }
  });
}

  editFaq(f: any) {
    this.editingId = f.id;
    this.faqForm = { ...f };
    this.modal = 'faq';
  }

  saveFaq() {
    if (!this.faqForm.question || !this.faqForm.answer) {
      this.modalError = 'Question and Answer are required.';
      return;
    }
    this.modalLoading = true;
    this.modalError = '';
    const req = this.editingId
      ? this.http.put(`${API}/faqs/${this.editingId}`, this.faqForm)
      : this.http.post(`${API}/faqs`, this.faqForm);

    req.subscribe({
      next: () => { this.closeModal(); this.loadFaqs(); this.loadStats(); this.showToast('FAQ saved!'); },
      error: () => { this.modalLoading = false; this.modalError = 'Save failed.'; }
    });
  }

toggleFaqStatus(f: any) {
  this.http.patch(`${API}/faqs/${f.id}/status?status=${!f.status}`, {}, { responseType: 'text' })
    .subscribe({
      next: () => { f.status = !f.status;this.loadStats();this.showToast('Status updated!'); },  //
      error: () => this.showToast('Failed to toggle status.', 'error')
    });
}

  deleteFaq(id: number) {
    if (!confirm('Delete this FAQ?')) return;

    this.http.delete(`${API}/faqs/${id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.faqs = this.faqs.filter(f => f.id !== id); // instant UI
          this.showToast('FAQ deleted.');
        },
        error: () => this.showToast('Delete failed.', 'error')
      });
  }

loadIntents() {
  this.http.get<any>(
    `${API}/intents?page=${this.intentPage}&size=8`
  ).subscribe({
    next: (res) => {

      console.log("INTENT RESPONSE:", res);


       this.stats.intents = res.total || 0;
      this.intents = res.data || [];

      this.intentTotalPages = res.totalPages || 1;
    },
    error: (err) => {
      console.error("Intent API error:", err);
      this.intents = [];
    }
  });
}


editIntent(i: any) {
  this.editingId = i.id;
  this.intentForm = {
    intentName: i.intentName,
    keywords: i.keywords,
    actionType: i.actionType,
    responseTemplate: i.responseTemplate,
    status: i.status
  };
  this.modal = 'intent';
}

 saveIntent() {
  if (!this.intentForm.intentName || !this.intentForm.keywords || !this.intentForm.actionType) {
    this.modalError = 'Intent Name, Keywords and Action Type are required.';
    return;
  }
  const payload = {
    intentName: this.intentForm.intentName,
    keywords: this.intentForm.keywords,
    actionType: this.intentForm.actionType,
    responseTemplate: this.intentForm.responseTemplate,
    status: true
  };
  this.modalLoading = true;
  this.modalError = '';
  const req = this.editingId
    ? this.http.put(`${API}/intents/${this.editingId}`, payload)
    : this.http.post(`${API}/intents`, payload);

  req.subscribe({
    next: () => { this.closeModal(); this.loadIntents(); this.loadStats(); this.showToast('Intent saved!'); },
    error: () => { this.modalLoading = false; this.modalError = 'Save failed.'; }
  });
}

  toggleIntentStatus(i: any) {
  this.http.patch(`${API}/intents/${i.id}/status?status=${!i.status}`, {}, { responseType: 'text' })
    .subscribe({
      next: () => { i.status = !i.status;this.loadStats();this.showToast('Status updated!'); },
      error: () => this.showToast('Failed.', 'error')
    });
}


  deleteIntent(id: number) {
    if (!confirm('Delete this intent?')) return;

    this.http.delete(`${API}/intents/${id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.intents = this.intents.filter(i => i.id !== id);
          this.showToast('Intent deleted.');
        },
        error: () => this.showToast('Delete failed.', 'error')
      });
  }


loadReferrals() {
    let url = `${API}/referrals?page=${this.referralPage}&size=10`;
    if (this.referralFilter.referrerPhone) url += `&referrerPhone=${this.referralFilter.referrerPhone}`;
    if (this.referralFilter.referredPhone) url += `&referredPhone=${this.referralFilter.referredPhone}`;
    if (this.referralFilter.status)        url += `&status=${this.referralFilter.status}`;

    this.http.get<any>(url).subscribe(res => {
        this.referrals = res ?? [];
        this.referralTotalPages = 1;
    });
}

updateReferralStatus(id: number, event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch(`${API}/referrals/${id}/status?status=${status}`, {}, { responseType: 'text' })
        .subscribe({
            next: () => {
                const referral = this.referrals.find(r => r.id === id);
                if (referral) referral.status = status;
                this.showToast('Referral status updated!');
            },
            error: () => this.showToast('Failed to update status.', 'error'),
        });
}


loadTrainers() {
  let url = `${API}/trainers?page=${this.trainerPage}&size=8`;

  if (this.trainerFilter.name) {
    url += `&name=${this.trainerFilter.name}`;
  }

  if (this.trainerFilter.specialization) {
    url += `&specialization=${this.trainerFilter.specialization}`;
  }

  this.http.get<any>(url).subscribe(res => {

    console.log("TRAINER RESPONSE:", res);

    this.trainers = res.data ?? res ?? [];


    this.trainerTotalPages = res.totalPages ?? 1;
  });
}

  editTrainer(t: any) {
    this.editingId = t.id;
    this.trainerForm = { ...t };
    this.modal = 'trainer';
  }

  saveTrainer() {
    if (!this.trainerForm.name || !this.trainerForm.email || !this.trainerForm.specialization) {
      this.modalError = 'Name, Email, and Specialization are required.';
      return;
    }
    this.modalLoading = true;
    this.modalError = '';
    const req = this.editingId
      ? this.http.put(`${API}/trainers/${this.editingId}`, this.trainerForm)
      : this.http.post(`${API}/trainers`, this.trainerForm);

    req.subscribe({
      next: () => { this.closeModal(); this.loadTrainers(); this.loadStats(); this.showToast('Trainer saved!'); },
      error: () => { this.modalLoading = false; this.modalError = 'Save failed.'; }
    });
  }

  toggleTrainerStatus(t: any) {
  this.http.patch(`${API}/trainers/${t.id}/status?status=${!t.status}`, {}, { responseType: 'text' })
    .subscribe({
      next: () => { t.status = !t.status;
            this.loadStats();
         this.showToast('Status updated!'); },
      error: () => this.showToast('Failed.', 'error')
    });
}

  deleteTrainer(id: number) {
    if (!confirm('Delete this trainer?')) return;

    this.http.delete(`${API}/trainers/${id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.trainers = this.trainers.filter(t => t.id !== id);
          this.showToast('Trainer deleted.');
        },
        error: () => this.showToast('Delete failed.', 'error')
      });
  }


loadConfigs() {
  let url = `${API}/config?page=${this.configPage}&size=10`;
  if (this.configFilter.key) url += `&key=${this.configFilter.key}`;

  this.http.get<any>(url).subscribe(res => {
    this.configs = res ?? [];
    this.configTotalPages = 1;
  });
}

 editConfig(cfg: any) {
  this.editingKey = cfg.configKey;
  this.configForm = {
    key: cfg.configKey,
    value: cfg.configValue
  };
  this.modal = 'config';
}

saveConfig() {
  if (!this.configForm.key || !this.configForm.value) {
    this.modalError = 'Key and Value are required.';
    return;
  }
  this.modalLoading = true;
  this.modalError = '';
  const payload = { configKey: this.configForm.key, configValue: this.configForm.value };
  const req = this.editingKey
    ? this.http.put(`${API}/config/${this.editingKey}`, payload)
    : this.http.post(`${API}/config`, payload);

  req.subscribe({
    next: () => { this.closeModal(); this.loadConfigs(); this.showToast('Config saved!'); },
    error: () => { this.modalLoading = false; this.modalError = 'Save failed.'; }
  });
}

deleteConfig(key: string) {
  if (!confirm(`Delete config key "${key}"?`)) return;
  this.http.delete(`${API}/config/${key}`, { responseType: 'text' })
    .subscribe({
      next: () => { this.loadConfigs(); this.showToast('Config deleted.'); },
      error: () => this.showToast('Delete failed.', 'error')
    });
}

loadLeads() {
    let url = `${API}/leads?page=${this.leadPage}&size=10&sortBy=id&direction=desc`;
    if (this.leadFilter.phone) url += `&phone=${this.leadFilter.phone}`;
    if (this.leadFilter.status) url += `&status=${this.leadFilter.status}`;
    if (this.leadFilter.requestType) url += `&requestType=${this.leadFilter.requestType}`;

    this.http.get<any>(url).subscribe(res => {
        this.leads = res ?? [];
        this.leadTotalPages = 1;
    });
}

updateLeadStatus(id: number, event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch(`${API}/leads/${id}/status?status=${status}`, {},
                    { responseType: 'text' })
        .subscribe({
            next: () => {
                const lead = this.leads.find(l => l.id === id);
                if (lead) lead.status = status;
                this.showToast('Lead status updated!');
            },
            error: () => this.showToast('Failed to update status.', 'error')
        });
}


loadCharts() {
    if (this.statusChart)         { this.statusChart.destroy();         this.statusChart = null;         }
    if (this.courseChart)         { this.courseChart.destroy();         this.courseChart = null;         }
    if (this.modeChart)           { this.modeChart.destroy();           this.modeChart = null;           }
    if (this.faqChart)            { this.faqChart.destroy();            this.faqChart = null;            }
    if (this.trainerChart)        { this.trainerChart.destroy();        this.trainerChart = null;        }
    if (this.timeChart)           { this.timeChart.destroy();           this.timeChart = null;           }
    if (this.referralStatusChart) { this.referralStatusChart.destroy(); this.referralStatusChart = null; }
    if (this.referralCourseChart) { this.referralCourseChart.destroy(); this.referralCourseChart = null; }

    forkJoin({
        byStatus:       this.http.get<any>(`${API}/analytics/leads/by-status`),
        byCourse:       this.http.get<any>(`${API}/analytics/leads/by-course`),
        byMode:         this.http.get<any>(`${API}/analytics/courses/by-mode`),
        topFaqs:        this.http.get<any>(`${API}/analytics/faqs/top`),
        byExp:          this.http.get<any>(`${API}/analytics/trainers/by-experience`),
        overTime:       this.http.get<any>(`${API}/analytics/leads/over-time?days=7`),
        referralStatus: this.http.get<any>(`${API}/analytics/referrals/by-status`).pipe(catchError(() => of({}))),
        referralCourse: this.http.get<any>(`${API}/analytics/referrals/by-course`).pipe(catchError(() => of({}))),
    }).subscribe(({ byStatus, byCourse, byMode, topFaqs, byExp, overTime, referralStatus, referralCourse }) => {
        this.renderStatusChart(byStatus);
        this.renderCourseChart(byCourse);
        this.renderModeChart(byMode);
        this.renderFaqChart(topFaqs);
        this.renderTrainerChart(byExp);
        this.renderTimeChart(overTime);
        if (Object.keys(referralStatus).length > 0) this.renderReferralStatusChart(referralStatus);
        if (Object.keys(referralCourse).length > 0)  this.renderReferralCourseChart(referralCourse);
    });
}
renderReferralStatusChart(data: any) {
    this.referralStatusChart = new Chart('referralStatusChart', {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values<number>(data),
                backgroundColor: ['#EF9F27', '#1D9E75', '#D85A30'],
                borderWidth: 0,
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { font: { size: 11 }, boxWidth: 10, },
                },
            },
        },
    });
}

renderReferralCourseChart(data: any) {
    const truncated: Record<string, number> = {};
    Object.entries(data).forEach(([key, val]) => {
        const label = key.length > 18 ? key.slice(0, 18) + '…' : key;
        truncated[label] = val as number;
    });

    this.referralCourseChart = new Chart('referralCourseChart', {
        type: 'doughnut',
        data: {
            labels: Object.keys(truncated),
            datasets: [{
                data: Object.values<number>(truncated),
                backgroundColor: ['#7F77DD', '#378ADD', '#5DCAA5', '#D85A30', '#EF9F27', '#D4537E'],
                borderWidth: 0,
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { font: { size: 11 }, boxWidth: 10, },
                },
            },
        },
    });
}

renderStatusChart(data: any) {
  this.statusChart = new Chart('statusChart', {
    type: 'doughnut',
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values<number>(data),
        backgroundColor: ['#EF9F27','#1D9E75','#D85A30'],
        borderWidth: 0
      }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 11 }, boxWidth: 10 }
        }
      }
    }
  });
}


renderModeChart(data: any) {
  this.modeChart = new Chart('modeChart', {
    type: 'bar',
    data: {
      labels: Object.keys(data).map(m => m.charAt(0).toUpperCase() + m.slice(1)),
      datasets: [{ data: Object.values(data), backgroundColor: ['#378ADD','#D85A30','#1D9E75'], borderRadius: 6, borderWidth: 0 }]
    },
    options: {
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { stepSize: 1 } } }
    }
  });
}

renderCourseChart(data: any) {
  const truncated: Record<string, number> = {};
  Object.entries(data).forEach(([key, val]) => {
    const label = key.length > 18 ? key.slice(0, 18) + '…' : key;
    truncated[label] = val as number;
  });

  this.courseChart = new Chart('courseChart', {
    type: 'doughnut',
    data: {
      labels: Object.keys(truncated),
      datasets: [{
        data: Object.values<number>(truncated),
        backgroundColor: ['#7F77DD','#378ADD','#5DCAA5','#D85A30','#EF9F27','#D4537E'],
        borderWidth: 0
      }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 11 },
            boxWidth: 10
          }
        }
      }
    }
  });
}

renderFaqChart(data: any) {
  const truncated: Record<string, number> = {};
  Object.entries(data).forEach(([key, val]) => {
    const label = key.length > 20 ? key.slice(0, 20) + '…' : key;
    truncated[label] = val as number;
  });

  this.faqChart = new Chart('faqChart', {
    type: 'doughnut',
    data: {
      labels: Object.keys(truncated),
      datasets: [{
        data: Object.values<number>(truncated),
        backgroundColor: ['#378ADD','#1D9E75','#EF9F27','#D85A30','#7F77DD'],
        borderWidth: 0
      }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 11 },
            boxWidth: 10
          }
        }
      }
    }
  });
}

renderTrainerChart(data: any) {
  this.trainerChart = new Chart('trainerChart', {
    type: 'doughnut',
    data: {
      labels: Object.keys(data),
      datasets: [{ data: Object.values<number>(data), backgroundColor: ['#378ADD','#1D9E75','#EF9F27','#D85A30'], borderWidth: 0 }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } }
    }
  });
}

renderTimeChart(data: any) {
  this.timeChart = new Chart('timeChart', {
    type: 'line',
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: 'Leads',
        data: Object.values<number>(data),
        borderColor: '#378ADD',
        backgroundColor: 'rgba(55,138,221,0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#378ADD',
        pointRadius: 4,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { ticks: { font: { size: 11 } } }
      }
    }
  });
}

  openModal(type: string) {
    this.modal = type;
    this.editingId = null;
    this.editingKey = null;
    this.modalError = '';
    this.modalLoading = false;


    this.courseForm = {
      isActive: true,

      batchTiming: '',
      nextBatchDate: '',
      brochureUrl: '',

      placementSupport: '',
      placementPercentage: '',
      highestPackage: '',
      hiringCompanies: '',
    };
    this.faqForm = { isActive: true };
    this.intentForm = { intentName: '', keywords: '', actionType: '', responseTemplate: '', status: true };
    this.trainerForm = {};
    this.configForm = {};
  }

  closeModal() {
    this.modal = null;
    this.editingId = null;
    this.editingKey = null;
    this.modalError = '';
    this.modalLoading = false;
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }
}
