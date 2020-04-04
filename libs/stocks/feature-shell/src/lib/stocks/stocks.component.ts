import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PriceQueryFacade } from '@coding-challenge/stocks/data-access-price-query';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'coding-challenge-stocks',
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.css']
})
export class StocksComponent implements OnInit, OnDestroy {
  stockPickerForm: FormGroup;
  subscription: Subscription;

  quotes$ = this.priceQuery.priceQueries$;

  timePeriods = [
    { viewValue: 'All available data', value: 'max' },
    { viewValue: 'Five years', value: '5y' },
    { viewValue: 'Two years', value: '2y' },
    { viewValue: 'One year', value: '1y' },
    { viewValue: 'Year-to-date', value: 'ytd' },
    { viewValue: 'Six months', value: '6m' },
    { viewValue: 'Three months', value: '3m' },
    { viewValue: 'One month', value: '1m' }
  ];

  get symbol(): AbstractControl {
    return this.stockPickerForm.get('symbol');
  }

  get period(): AbstractControl {
    return this.stockPickerForm.get('period');
  }

  constructor(private fb: FormBuilder, private priceQuery: PriceQueryFacade) {}

  ngOnInit() {
    this.stockPickerForm = this.fb.group({
      symbol: [null, Validators.required],
      period: [null, Validators.required]
    });

    this.formValueChanges();
  }

  /**
   * when a form field value changes subscribes to the changes and
   * waits for certain period of time to fetch the quotes
   */
  private formValueChanges(): void {
    const symbolValueChanges$ = this.symbol.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    );

    const periodValueChanges$ = this.period.valueChanges.pipe(
      distinctUntilChanged()
    );

    this.subscription = combineLatest(symbolValueChanges$, periodValueChanges$).subscribe(
      ([symbol, period]) => this.priceQuery.fetchQuote(symbol, period));
  }

  /**
   * an event that occurs on click to fetch quotes with valid details
   */
  private fetchQuote(): void {
    if (this.stockPickerForm.valid) {
      const { symbol, period } = this.stockPickerForm.value;
      this.priceQuery.fetchQuote(symbol, period);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
