## Basic Usage
This sample illustrates how to..
* ..declare state
* ..use and manipulate state across different components
* ..manipulate state from global scope

The only thing you need to do to make state shared and reactive is
to use the ```@state()``` decorator when you declare state classes.

After this, employ ```@use()``` you pull state in a LitElement.

Consider the following example.
Here, our state is used in two components.
One component also has a button to modify it.
In addition, there is a global interval that continuously modifies the state.

<code-sample folder="samples/basic" style="height: 600px;"> </code-sample>

#### Relevant APIs
* [state](api/modules.html#state) - decorator to define and use state
* [use](api/modules.html#use) - decorator to define and use state
