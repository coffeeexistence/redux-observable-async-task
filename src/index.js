import { Observable } from 'rxjs';

export const callAsyncTask = asyncTask => source =>
  Observable.create(observer => {
    const put = actionToEmit => observer.next(actionToEmit);

    const take = filterFn =>
      new Promise(resolve =>
        source
          .filter(filterFn)
          .map(resolve)
          .take(1)
          .subscribe(),
      );

    const call = (childAsyncTask, ...taskArgs) => {
      try {
        return childAsyncTask({ put, call, take }, ...taskArgs);
      } catch (error) {
        console.error('Issue with asyncTask', error);
        throw error;
      }
    };

    const finished = () => {
      try {
        observer.complete();
      } catch (error) {
        // Without this, errors in the subscriber's onComplete handler can be
        // swallowed silently, which makes for tricky debugging
        console.error('Error in subscriber onComplete handler', error);
        throw error;
      }
    };

    asyncTask({ put, call, take })
      .then(finished)
      .catch(error => {
        console.error(
          `asyncTask rejected due to following error: ${error.message}`,
          error,
        );
        observer.error(error);
      });
  });