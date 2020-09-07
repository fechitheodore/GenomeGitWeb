import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkTreeNestedExample } from './cdk-tree-nested-example';

describe('CdkTreeNestedExampleComponent', () => {
  let component: CdkTreeNestedExample;
  let fixture: ComponentFixture<CdkTreeNestedExample>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CdkTreeNestedExample ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CdkTreeNestedExample);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
