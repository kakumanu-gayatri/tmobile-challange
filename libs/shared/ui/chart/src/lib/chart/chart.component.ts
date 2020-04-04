import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { ChartInformatonInterface } from './interfaces/chart-informaton.interface';

@Component({
  selector: 'coding-challenge-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {
  @Input() chartData: Array<Array<string | number>>;
  private chart: ChartInformatonInterface;

  constructor() {}

  ngOnInit() {
    this.chart = {
      title: '',
      type: 'LineChart',
      data: [],
      columnNames: ['period', 'close'],
      options: { title: `Stock price`, width: '600', height: '400' }
    };
  }
}
