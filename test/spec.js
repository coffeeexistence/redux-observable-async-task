/* eslint-disable no-unused-expressions */
/* globals describe it */
import { Observable, Subject } from 'rxjs';
import { expect } from 'chai';
import callAsyncTask from '../lib/cjs';

const verifyActions = (observable, expectations, done) => {
  if (!done) {
    throw new Error('Async test requires `done`');
  }
  observable.toArray().subscribe(
    actions => {
      expectations(actions);
      done();
    },
    err => {
      throw err;
    },
  );
};

const fooActionCreator = () => ({ type: 'foo' });
const barActionCreator = () => ({ type: 'bar' });
const bazActionCreator = () => ({ type: 'baz' });

describe('callAsyncTask operator', () => {
  it('should exist', () => {
    expect(callAsyncTask).to.be.a('function');
  });

  it('should return an observable', () => {
    const asyncTask = async () => {};
    const epic = Observable.of(fooActionCreator())::callAsyncTask(asyncTask);
    expect(epic.subscribe).to.exist;
  });

  it('should provide the item emitted to the asyncTask', (done) => {
    const epic = Observable.of(fooActionCreator())
      ::callAsyncTask(async (_utils, action) => {
        expect(action.type).to.equal('foo');
        done();
      });
    epic.subscribe();
  });

  describe('PUT', () => {
    it('should emit items', done => {
      const epic = Observable.of(fooActionCreator())
        ::callAsyncTask(async ({ put }) => {
          put(barActionCreator());
          put(bazActionCreator());
        });

      const emitted = [];
      epic.subscribe(
        item => emitted.push(item),
        null,
        () => {
          expect(emitted).to.deep.equal([
            barActionCreator(),
            bazActionCreator()
          ]);
          done();
        }
      );
    });

    it('should emit items (testAsyncTask)', done => {
      const epic = Observable.of(fooActionCreator())
        ::callAsyncTask(async ({ put }) => {
          put(barActionCreator());
          put(bazActionCreator());
        });

      verifyActions(epic, actions => {
        expect(actions).to.deep.equal([
          barActionCreator(),
          bazActionCreator()
        ]);
      }, done);
    });
  });

  describe('CALL', () => {
    it('should emit items when calling from a child asyncTask', done => {
      const childAsyncTask = async ({ put }) => {
        put(barActionCreator());
      };
      const epic = Observable.of(fooActionCreator())
        ::callAsyncTask(async ({ call }) => {
          await call(childAsyncTask);
        });

      verifyActions(epic, actions => {
        expect(actions).to.deep.equal([barActionCreator()]);
      }, done);
    });
  });

  describe('TAKE', () => {
    it('should resolve when action emiited which meets filter criteria', done => {
      const actionStream = new Subject();
      const epic = Observable.from(actionStream)
        .filter(action => action.type === 'INITIAL_ACTION')
        ::callAsyncTask(async ({ take, put }) => {
          await take(action => action.type === 'BAR');
          put({ type: 'GOT_BAR' });
        });

      verifyActions(epic, actions => {
        expect(actions).to.deep.equal([{ type: 'GOT_BAR' }]);
      }, done);

      actionStream.next({ type: 'INITIAL_ACTION' });
      actionStream.next({ type: 'BAR' });
      actionStream.complete();
    });
  });

  it('should resolve with the first action that met the filter criteria', done => {
    const actionStream = new Subject();
    const epic = Observable.from(actionStream)
      .filter(action => action.type === 'INITIAL_ACTION')
      ::callAsyncTask(async ({ take, put }) => {
        const { payload } = await take(action => action.type === 'BAR');
        put({ type: 'GOT_BAR', payload });
      });

    verifyActions(epic, actions => {
      expect(actions).to.deep.equal([{ type: 'GOT_BAR', payload: 'payload' }]);
    }, done);

    actionStream.next({ type: 'INITIAL_ACTION' });
    actionStream.next({ type: 'BAR', payload: 'payload' });
    actionStream.complete();
  });
});
