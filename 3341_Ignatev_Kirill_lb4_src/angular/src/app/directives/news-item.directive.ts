import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { News } from '../services/news.service';

@Directive({
  selector: '[appNewsItem]',
  standalone: true
})
export class NewsItemDirective implements OnInit {
  @Input() news!: News;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Добавляем эффект появления при загрузке
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(20px)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'opacity 0.3s ease, transform 0.3s ease');

    // Анимация появления
    setTimeout(() => {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0)');
    }, 10);

    // Эффект наведения
    this.renderer.listen(this.el.nativeElement, 'mouseenter', () => {
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-5px)');
      this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 4px 8px rgba(0,0,0,0.2)');
    });

    this.renderer.listen(this.el.nativeElement, 'mouseleave', () => {
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0)');
      this.renderer.setStyle(this.el.nativeElement, 'box-shadow', 'none');
    });
  }
}

