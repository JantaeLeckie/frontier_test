import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  components: {},
  name: 'dummy-component',
})


class Dummycomponent extends Vue {
  // --------------------------------------------------------------------------
  // Fields
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // Props
  // --------------------------------------------------------------------------
  @Prop({ default: 'default' }) public customProp!: string;
  // --------------------------------------------------------------------------
  // Constructor
  // --------------------------------------------------------------------------
  constructor() {
    super();
  }

  // --------------------------------------------------------------------------
  // Accessors
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // Methods
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // Lifecycle Hooks
  // --------------------------------------------------------------------------
  public mounted() {
    // TODO: stuff to do when this component loads.
  }
}

export {
  Dummycomponent as default,
  Dummycomponent,
};
