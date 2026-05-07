import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { APP_ICONS, AppIconName } from '../../icons';

interface SocialLink {
  icon: AppIconName;
  label: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  protected icons = APP_ICONS;
  year = new Date().getFullYear();

  columns = [
    {
      title: 'Customer Service',
      items: ['Help Center', 'Shipping & Delivery', 'Returns & Refunds', 'FAQs'],
    },
    {
      title: 'Company',
      items: ['About Us', 'Careers', 'Blog', 'Contact Us'],
    },
    {
      title: 'Categories',
      items: ['Men', 'Women', 'Accessories', 'Sale'],
    },
  ];

  socials: SocialLink[] = [
    { icon: 'Facebook', label: 'Facebook' },
    { icon: 'Instagram', label: 'Instagram' },
    { icon: 'Twitter', label: 'Twitter' },
    { icon: 'Youtube', label: 'Youtube' },
  ];

  trackByCol = (_: number, c: { title: string }): string => c.title;
  trackByItem = (_: number, item: string): string => item;
  trackBySocial = (_: number, s: { label: string }): string => s.label;
}
