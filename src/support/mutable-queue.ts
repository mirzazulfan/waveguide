// Copyright 2019 Ryan Zeigler
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export class MutableQueue<A> {
  private array: A[] = [];

  public enqueue(a: A): void {
    this.array.push(a);
  }

  public dequeue(): A | undefined {
    return this.array.shift();
  }

  public peek(): A | undefined {
    return this.isEmpty() ? undefined : this.array[0];
  }

  public isEmpty(): boolean {
    return this.array.length === 0;
  }

  public size(): number {
    return this.array.length;
  }
}
