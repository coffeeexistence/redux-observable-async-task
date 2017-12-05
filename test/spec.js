/* eslint-disable no-unused-expressions */
/* globals describe it */
import { Observable } from 'rxjs';
import { expect } from 'chai';
import callAsyncTask from '../lib/cjs';

const actions = {
  foo: () => ({ type: 'foo' }),
};


describe('callAsyncTask operator', () => {
  it('should exist', () => {
    expect(callAsyncTask).to.be.a('function');
  });

  it('should return an observable', () => {
    const epic = Observable.of('foo')::callAsyncTask(async () => {});
    expect(epic.subscribe).to.exist;
  });

  it('should provide the item emitted to the asyncTask', (done) => {
    const epic = Observable.of(actions.foo())
      ::callAsyncTask(async (_utils, action) => {
        expect(action.type).to.equal('foo');
        done();
      });
    epic.subscribe();
  });
});
