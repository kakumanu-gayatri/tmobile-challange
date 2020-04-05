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

  get symbol(): AbstractControl {
    return this.stockPickerForm.get('symbol');
  }

  get periodFrom(): AbstractControl {
    return this.stockPickerForm.get('periodFrom');
  }

  get periodTo(): AbstractControl {
    return this.stockPickerForm.get('periodTo');
  }

  constructor(private fb: FormBuilder, private priceQuery: PriceQueryFacade) {}

  ngOnInit() {
    this.stockPickerForm = this.fb.group({
      symbol: [null, Validators.required],
      periodFrom: [null, Validators.required],
      periodTo: [null, Validators.required]
    }, {validator: this.validateDateRange});

    this.formValueChanges();
  }

  /**
   * custom validator for validating teh dates entered in from and to are valid
   * returns null as validators are set directly
   * @param group - form group
   */
  validateDateRange(group: FormGroup): void {
    const presentDate = new Date();
    const periodFrom = group.controls['periodFrom'];
    const periodTo = group.controls['periodTo'];

    if (periodFrom && Date.parse(periodFrom.value) > Date.parse(presentDate.toString())) {
      periodFrom.setErrors({isNotValid: true});
    } else {
      periodFrom.setErrors(null);
    }
    if (periodTo && periodFrom && Date.parse(periodTo.value) < Date.parse(periodFrom.value)) {
      periodTo.setErrors({isNotValid: true});
    } else {
      periodTo.setErrors(null);
    }

    return null;
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

    const periodFromValueChanges$ = this.periodFrom.valueChanges.pipe(
      distinctUntilChanged()
    );

    const periodToValueChanges$ = this.periodTo.valueChanges.pipe(
      distinctUntilChanged()
    );

    this.subscription = combineLatest(symbolValueChanges$, periodFromValueChanges$, periodToValueChanges$).subscribe(
      ([symbol, periodFrom, periodTo]) => {
        this.fetchQuoteWithDateRange(symbol, periodFrom, periodTo);
      });
  }

  /**
   * calculates and check if the range is valid and sets both the dates same if not valid
   * then makes an api call to fetch the quotes for graph
   * @param symbol - symbol
   * @param periodFrom - minimum date from
   * @param periodTo - maximum date to
   */
  fetchQuoteWithDateRange(symbol: string, periodFrom: string, periodTo: string): void {
    if (Date.parse(periodTo) < Date.parse(periodFrom) || Date.parse(periodFrom) > Date.parse(new Date().toString())) {
      this.stockPickerForm.patchValue({periodFrom: periodFrom, periodTo: periodFrom})
    }
    this.priceQuery.fetchQuote(symbol, this.getDateRangePeriod(periodTo, periodFrom));
  }

  /**
   * calculates the difference between periods entered and based on number of days sets the period to the range for the api call
   * returns the rounded period for api
   * @param periodTo - the maximum date range ends
   * @param periodFrom - the minimum date range starts
   */
  getDateRangePeriod(periodTo: string, periodFrom: string): string {
    const timeDiff = Math.abs(Date.parse(periodTo) - Date.parse(periodFrom));
    const numberOfDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    let period = 'max';
    if(numberOfDays <= 31) {
      period =   '1m';
    } else if (numberOfDays > 31 && numberOfDays <= 93) {
      period =   '3m';
    }else if (numberOfDays > 93 && numberOfDays <= 186) {
      period =   '6m';
    }else if (numberOfDays > 186 && numberOfDays <= 365) {
      period =   '1y';
    }else if (numberOfDays > 365 && numberOfDays <= 730) {
      period =   '2y';
    }else if (numberOfDays > 730 && numberOfDays <= 1825) {
      period =   '5y';
    }

    return period;
  }

  /**
   * an event that occurs on click to fetch quotes with valid details
   */
  private fetchQuote(): void {
    if (this.stockPickerForm.valid) {
      const { symbol, periodFrom, periodTo } = this.stockPickerForm.value;
      this.fetchQuoteWithDateRange(symbol, periodFrom, periodTo);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
