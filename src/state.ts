import { BehaviorSubject, Observer, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';


export type Comparator<T> = (a: T, b: T) => boolean;


export class State<T> extends BehaviorSubject<T> {
  private subcriptions: Subscription;

  constructor(initial: T,
    private comparator: Comparator<T> = (a, b) => a === b,
    downstream?: Observable<T>,
    private upstream?: Observer<T>,
  ) {
    super(initial);
    if (downstream) {
      this.subcriptions = downstream.subscribe({
        next: v => this._receive(v, false),
        error: err => this.error(err),
        complete: () => this.complete(),
      });
    }
  }

  public next(t: T) { this._receive(t); }
  public get value(): T { return this.getValue(); }
  public set value(val: T) { this.next(val); }

  public sub<K extends keyof T>(key: K, comp: Comparator<T[K]> = (a, b) => a === b) {
    return new State<T[K]>(
      this.value ? this.value[key] : undefined as any,
      comp,
      this.pipe(map(v => v ? v[key] : undefined as any)),
      {
        next: v => {
          this.value[key] = v!!;
          super.next(this.value);
          this._upPropagate();
        },
        error: err => this.error(err),
        complete: () => {},
      }
    )
  }

  public complete() {
    super.complete();
    this.upstream?.complete();
    this.subcriptions?.unsubscribe();
  }

  public error(err: any) {
    super.error(err);
    this.upstream?.error(err);
    this.subcriptions?.unsubscribe();
  }

  public unsubscribe() {
    super.unsubscribe();
    this.upstream?.complete();
    this.subcriptions?.unsubscribe();
  }

  private _receive(t: T, upPropagate = true) {
    if (!this.comparator(this.getValue(), t)) {
      super.next(t);
      if (upPropagate) this._upPropagate();
    }
  }

  private _upPropagate() {
    if (this.upstream && !this.upstream.closed)
      this.upstream.next(this.value);
  }
}
