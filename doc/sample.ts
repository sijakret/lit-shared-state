import { html, LitElement, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('code-sample')
export class CodeSample extends LitElement {
  @property() patch = false;
  @property() folder?: string;
  @state() files = {};

  updated(changed: Map<string | number | symbol, unknown>): void {
    if (changed.has('folder')) {
      this.folder && this.load(this.folder);
    }
  }

  async load(folder: string) {
    let index = (await (await fetch(`${folder}/index.json`)).json()) as {
      files: string[];
    };
    if (this.patch) {
      index.files = [...index.files, './lit-shared-state.ts'];
    }
    const files = await Promise.all(
      index.files.map(async (file) => {
        const isLib = file.startsWith('./');
        return {
          file: isLib ? file.substring(2) : file,
          hidden: isLib,
          content: await (
            await fetch(isLib ? file : `${folder}/${file}`)
          ).text(),
        };
      })
    );
    this.files = files.reduce(
      (a, f) => ({
        ...a,
        [f.file]: { content: this.patchCode(f.content), hidden: f.hidden },
      }),
      {}
    );
  }

  createRenderRoot() {
    return this;
  }
  patchCode(content: string) {
    if (this.patch) {
      return content
        .split(`'lit-shared-state'`)
        .join(`'./lit-shared-state.js'`);
    }
    return content;
  }

  render() {
    return html`<playground-ide
      style="height: 500px"
      class="playground-theme-yonce"
      line-numbers
      resizable
      .config=${{
        files: {
          ...this.files,
          ...staticFiles,
        },
        dependencies: {
          lit: '^2.0.2',
          'lit-shared-state': '..',
        },
      }}
    >
    </playground-ide>`;
  }
}

const staticFiles = {
  //   'lit-shared-state.ts': {
  //     content: '',
  //   },
};
