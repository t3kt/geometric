import {EventEmitter} from "@angular/core";

export class ObservableValue<T> {
  private _value: T;
  readonly changed = new EventEmitter<T>();

  constructor(value?: T) {
    this._value = value;
  }

  get value(): T {
    return this._value;
  }

  set value(v: T) {
    if (v == this._value) {
      return;
    }
    this._value = v;
    this.notifyChanged();
  }

  clear(): void {
    this.value = null;
  }

  notifyChanged(): void {
    this.changed.emit(this._value);
  }
}
