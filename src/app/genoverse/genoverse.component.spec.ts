import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenoverseComponent } from './genoverse.component';

describe('GenoverseComponent', () => {
  let component: GenoverseComponent;
  let fixture: ComponentFixture<GenoverseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GenoverseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenoverseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
