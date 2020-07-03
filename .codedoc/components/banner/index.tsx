import { ThemedComponentThis } from '@connectv/jss-theme';
import { RendererLike } from '@connectv/html';
import { CodedocTheme } from '@codedoc/core';
import { DarkLight, InLight, InDark } from '@codedoc/core/components';

import { BannerStyle } from './style';
import { Bubble } from './bubble';


export function Banner(
  this: ThemedComponentThis<CodedocTheme>,
  _: any,
  renderer: RendererLike<any, any>,
) {
  const classes = this.theme.classes(BannerStyle);
  return <div class={classes.container}>
    <div class={classes.content}>
      <div class={classes.octo}>
        <img src='/docs/assets/octo.svg'/>
        <img src='/docs/assets/octo-light.svg' class={classes.octoLight}/>
      </div>
      <div class={classes.text}>
        <DarkLight>
          <InLight><img src='/docs/assets/logo-type.svg'/></InLight>
          <InDark><img src='/docs/assets/logo-type-dark.svg'/></InDark>
        </DarkLight>
      </div>
    </div>

    <Bubble x={30} z={1} radius={128} duration={8}/>
    <Bubble x={3} radius={32} duration={12} start={1}/>
    <Bubble x={50} z={1} radius={64} duration={15} start={-1}/>
    <Bubble x={50} z={1} radius={32} duration={15} start={-.5}/>
    <Bubble x={50} z={1} radius={32} duration={15} />
    <Bubble x={70} z={1} radius={32} duration={6} start={2}/>
    <Bubble x={80} radius={64} duration={9} start={-2}/>
    <Bubble x={8} radius={256} duration={30} start={3}/>

    <Bubble x={40} radius={200} duration={12} start={4}/>
    <Bubble x={35} radius={128} duration={8} start={5}/>
    <Bubble x={60} z={1} radius={64} duration={9} start={6}/>
    <Bubble x={15} radius={32} duration={6} start={7}/>
    <Bubble x={15} radius={28} duration={6} start={7.15}/>

    <Bubble x={75} radius={36} duration={12} start={8}/>
    <Bubble x={25} radius={128} duration={7} start={9}/>
    <Bubble x={65} radius={32} duration={6} start={10}/>
    <Bubble x={20} radius={32} duration={6} start={11}/>
    <Bubble x={45} z={1} radius={48} duration={7} start={12}/>
  </div>
}