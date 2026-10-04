(async () => {
    const wpRegistry = webpackChunkdiscord_app.push([[Symbol()], {}, (r) => r]);
    webpackChunkdiscord_app.pop();
    const modulesList = Object.entries(wpRegistry.m);

    const grabModuleBySource = (...snippets) => {
        for (let i = 0; i < modulesList.length; i++) {
            const [id, func] = modulesList[i];
            const src = func.toString();
            if (snippets.every((snip) => src.includes(snip))) return wpRegistry(id);
        }
    };

    const activeCache = webpackChunkdiscord_app.push([[Symbol()], {}, (r) => r.c]);
    webpackChunkdiscord_app.pop();

    const searchExports = (...predicates) => {
        for (const mod of Object.values(activeCache)) {
            try {
                if (!mod.exports || mod.exports === window) continue;
                if (predicates.every((fn) => fn(mod.exports))) return mod.exports;

                for (const key in mod.exports) {
                    const subProp = mod.exports[key];
                    if (subProp && predicates.every((fn) => fn(subProp)) && subProp[Symbol.toStringTag] !== 'IntlMessagesProxy') {
                        return subProp;
                    }
                }
            } catch {}
        }
    };

    const searchAllExports = (...predicates) => {
        const matches = [];
        for (const mod of Object.values(activeCache)) {
            try {
                if (!mod.exports || mod.exports === window) continue;
                if (predicates.every((fn) => fn(mod.exports))) matches.push(mod.exports);

                for (const key in mod.exports) {
                    const subProp = mod.exports[key];
                    if (subProp && predicates.every((fn) => fn(subProp)) && subProp[Symbol.toStringTag] !== 'IntlMessagesProxy') {
                        matches.push(subProp);
                    }
                }
            } catch {}
        }
        return matches;
    };

    const getByProps = (...props) => searchExports((m) => props.every((p) => p in (m || {})));
    const getByPropsAll = (...props) => searchAllExports((m) => props.every((p) => p in (m || {})));

    const triggerNotification = (msg, toastType) => 
        getByProps('showToast').showToast(getByProps('createToast').createToast(msg, toastType, { duration: 2000 }));

    const DiscordUI = {
        ...getByProps('openModal', 'closeModal'),
        ...getByProps('ConfirmModal'),
        ...getByProps('Text'),
        ...getByProps('Colors'),
    };

    DiscordUI.CustomModal = searchExports((e) => {
        if (typeof e !== 'function') return;
        const codeStr = e?.toString?.();
        return codeStr.match(/gradientColor:[a-z-A-Z0-9$_]+="purple"/) && codeStr.includes('paddingSize:"lg"');
    });

    DiscordUI.CustomText = getByPropsAll('render').filter((e) => e.render.toString().includes('tabularNumbers:'))[0].render;

    if (!DiscordUI.CustomModal || !DiscordUI.CustomText) {
        throw new Error('نظام التشغيل المطور: فشل في تحميل عناصر النظام الأساسية.');
    }

    const { jsx } = getByProps('jsx');
    const httpClient = Object.values(grabModuleBySource('HTTPUtils')).find((e) => e?.get);

    const removeBadgeAPI = () => httpClient.del({ url: '/hypesquad/online' });
    const assignBadgeAPI = (houseId) => httpClient.post({ url: '/hypesquad/online', body: { house_id: houseId } });

    const HypeHouses = { Bravery: 1, Brilliance: 2, Balance: 3 };
    const IconUrls = {
        Brilliance: 'https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png',
        Bravery: 'https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png',
        Balance: 'https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png'
    };

    const statusToast = getByProps('CLIP', 'SUCCESS');

    const badgeOptions = [
        { id: 'Bravery', icon: IconUrls.Bravery, name: 'Bravery House' },
        { id: 'Brilliance', icon: IconUrls.Brilliance, name: 'Brilliance House' },
        { id: 'Balance', icon: IconUrls.Balance, name: 'Balance House' },
        { id: null, icon: null, name: 'Remove Badge' }
    ];

    const executeChange = (badgeId) => {
        if (!badgeId) {
            removeBadgeAPI();
            DiscordUI.closeModal(activeModalId);
            triggerNotification('تم إزالة الشارة بنجاح.', statusToast.SUCCESS);
            return;
        }
        assignBadgeAPI(HypeHouses[badgeId]).then((res) => {
            if (res.ok) {
                triggerNotification(`تم تعيين الشارة بنجاح إلى ${badgeId}!`, statusToast.SUCCESS);
            } else {
                triggerNotification('حدث خطأ أثناء محاولة تحديث الشارة.', statusToast.ERROR);
            }
        });
        DiscordUI.closeModal(activeModalId);
    };

    const RenderIconWrapper = ({ src, label }) =>
        jsx('div', {
            style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#e0e0e0', fontWeight: '500' }, 
            children: [
                src && jsx('img', { src, style: { width: '18px', height: '18px' } }),
                label
            ]
        });

    const RenderOptionButton = ({ id, name, icon }) =>
        jsx('button', {
            style: { 
                backgroundColor: '#2b2d31', 
                border: '1px solid #3f4248', 
                borderRadius: '8px', 
                padding: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease-in-out',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }, 
            onClick: () => executeChange(id),
            onMouseOver: (e) => { e.currentTarget.style.backgroundColor = '#35373c'; e.currentTarget.style.borderColor = '#4e525a'; },
            onMouseOut: (e) => { e.currentTarget.style.backgroundColor = '#2b2d31'; e.currentTarget.style.borderColor = '#3f4248'; },
            children: jsx(RenderIconWrapper, { src: icon, label: name })
        });

    let activeModalId = DiscordUI.openModal((modalProps) =>
        jsx(DiscordUI.CustomModal, {
            title: 'HypeSquad Manager',
            onCancel: () => DiscordUI.closeModal(activeModalId),
            ...modalProps,
            children: jsx('div', {
                style: { display: 'flex', gap: '14px', flexDirection: 'column', padding: '6px' },
                children: [
                    jsx(DiscordUI.CustomText, {
                        variant: 'text-md/medium',
                        style: { color: '#ffffff', textAlign: 'center' }, 
                        children: 'اختر الشارة الشخصية لحسابك:'
                    }),
                    jsx('div', {
                        style: { display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '4px' },
                        children: badgeOptions.map(RenderOptionButton)
                    }),
                    jsx(DiscordUI.CustomText, {
                        variant: 'text-xs/normal',
                        style: { color: '#7f7f7f', textAlign: 'center', marginTop: '16px', borderTop: '1px solid #2a2a2a', paddingTop: '12px', letterSpacing: '0.5px' },
                        children: '© Pixel HUB | joox.10 '
                    })
                ]
            })
        })
    );
})();