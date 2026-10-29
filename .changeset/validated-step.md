---
'@falkara/presentation': minor
---

`Typography.Step` is a schema, and `Color.verify` and `Color.shade` decode the step they are given with the rest of their input before its size decides the contrast its text needs. A step whose smallest size lies outside the minimum and the maximum font size is refused. So is a step that shrinks or grows by more than 8/5, as its size at the minimum viewport width would no longer be its smallest and could earn small text the ratio of large text.
