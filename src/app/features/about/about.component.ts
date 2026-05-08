import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { APP_ICONS } from '../../shared/icons';

interface Stat {
  value: string;
  label: string;
}

interface Value {
  icon: keyof typeof APP_ICONS;
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  bg: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, NavbarComponent, FooterComponent],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  protected icons = APP_ICONS;

  stats: Stat[] = [
    { value: '50K+', label: 'Happy Customers' },
    { value: '10K+', label: 'Products Listed' },
    { value: '120+', label: 'Brands Partnered' },
    { value: '99%', label: 'Satisfaction Rate' },
  ];

  values: Value[] = [
    {
      icon: 'CheckCircle2',
      title: 'Quality First',
      description: 'Every product is carefully curated to meet our high standards before it reaches you.',
    },
    {
      icon: 'Heart',
      title: 'Customer Love',
      description: 'Your satisfaction is our top priority. We go the extra mile to make every experience memorable.',
    },
    {
      icon: 'ShoppingBag',
      title: 'Best Value',
      description: 'We negotiate directly with suppliers so you always get the best price on the market.',
    },
    {
      icon: 'Users',
      title: 'Community Driven',
      description: 'Built on trust, shaped by our community. Real reviews from real customers guide every decision.',
    },
  ];

  team: TeamMember[] = [
    { name: 'Alex Rivera', role: 'CEO & Co-Founder', initials: 'AR', bg: 'bg-blue-500' },
    { name: 'Sara Malik', role: 'Head of Product', initials: 'SM', bg: 'bg-rose-500' },
    { name: 'James Liu', role: 'Lead Engineer', initials: 'JL', bg: 'bg-emerald-500' },
    { name: 'Priya Das', role: 'Head of Design', initials: 'PD', bg: 'bg-violet-500' },
  ];

  trackByStat = (_: number, s: Stat): string => s.label;
  trackByValue = (_: number, v: Value): string => v.title;
  trackByMember = (_: number, m: TeamMember): string => m.name;
}
