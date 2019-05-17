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

import { IO, succeed } from "../../src/io";

const unfold = (max: number) => (cur: number): IO<never, number> =>
  max === cur ? succeed(max) : succeed(max).chain((n) => unfold(max)(cur + 1).map((m) => m + n));

const start = process.hrtime.bigint();
// tslint:disable-next-line
unfold(1000000)(0).unsafeRun((result) => console.log(process.hrtime.bigint() - start, result));
