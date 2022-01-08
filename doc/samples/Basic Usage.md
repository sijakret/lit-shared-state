## Basic Usage
This sample illustrates how to..
* declare state
* use and manipulate state across different components
* manipulate state from global scope

Literally the only thing you need to do to make state shared and reactive is
to use the ```@state``` decorator when you declare state classes and when ```@use``` you pull state in
a LitElement.
How can it get any easier than that? :)

In the example the state is used in two components.
One component also has a button to modify it.
In addition, there is a global interval that continuously modifies the state.

<code-sample folder="samples/basic" style="height: 600px;"> </code-sample>
<!-- 
<details>
<summary>Same example in javascript</summary>
<code-sample folder="samples/basic-js" style="height: 600px;"> </code-sample>
</details> -->

#### Relevant APIs
* [state](api/modules.html#state) - decorator to define and use state
* [use](api/modules.html#use) - decorator to define and use state
